/**
 * Tests for the DnsRecordManager class.
 *
 * Covers: zone management, record CRUD, SPF/DKIM/DMARC generation,
 * validation logic, and CNAME conflict detection.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DnsRecordManager } from "../src/records/manager";
import { RecordType } from "../src/types";
import type { SpfConfig, DkimConfig, DmarcPolicy } from "../src/types";

describe("DnsRecordManager", () => {
  let manager: DnsRecordManager;

  beforeEach(() => {
    manager = new DnsRecordManager();
  });

  // =========================================================================
  // Zone management
  // =========================================================================

  describe("zone management", () => {
    it("should create a zone with default NS records and SOA", () => {
      const zone = manager.createZone("example.com");

      expect(zone.domain).toBe("example.com");
      expect(zone.soa.primaryNs).toBe("ns1.emailed.dev");
      expect(zone.serial).toBeGreaterThan(0);

      // Should have 2 default NS records
      const nsRecords = manager.getRecords("example.com", "@", RecordType.NS);
      expect(nsRecords).toHaveLength(2);
      expect(nsRecords.map((r) => r.value)).toContain("ns1.emailed.dev");
      expect(nsRecords.map((r) => r.value)).toContain("ns2.emailed.dev");
    });

    it("should throw when creating a duplicate zone", () => {
      manager.createZone("dup.com");
      expect(() => manager.createZone("dup.com")).toThrowError(/already exists/);
    });

    it("should retrieve and delete zones", () => {
      manager.createZone("get-del.com");
      expect(manager.getZone("get-del.com")).toBeDefined();
      expect(manager.getAllZones()).toHaveLength(1);

      const deleted = manager.deleteZone("get-del.com");
      expect(deleted).toBe(true);
      expect(manager.getZone("get-del.com")).toBeUndefined();
    });
  });

  // =========================================================================
  // Record CRUD
  // =========================================================================

  describe("record CRUD", () => {
    beforeEach(() => {
      manager.createZone("crud.com");
    });

    it("should create and retrieve a TXT record", () => {
      const record = manager.createRecord({
        domain: "crud.com",
        name: "@",
        type: RecordType.TXT,
        value: "v=spf1 ~all",
        ttl: 300,
      });

      expect(record.id).toBeTruthy();
      expect(record.value).toBe("v=spf1 ~all");

      const fetched = manager.getRecords("crud.com", "@", RecordType.TXT);
      expect(fetched).toHaveLength(1);
      expect(fetched[0]!.id).toBe(record.id);
    });

    it("should update a record's value and TTL", () => {
      const record = manager.createRecord({
        domain: "crud.com",
        name: "sub",
        type: RecordType.A,
        value: "1.2.3.4",
        ttl: 300,
      });

      const updated = manager.updateRecord("crud.com", record.id, {
        value: "5.6.7.8",
        ttl: 600,
      });

      expect(updated.value).toBe("5.6.7.8");
      expect(updated.ttl).toBe(600);
    });

    it("should delete a record by ID", () => {
      const record = manager.createRecord({
        domain: "crud.com",
        name: "del",
        type: RecordType.A,
        value: "10.0.0.1",
      });

      const deleted = manager.deleteRecord("crud.com", record.id);
      expect(deleted).toBe(true);

      const results = manager.getRecords("crud.com", "del", RecordType.A);
      expect(results).toHaveLength(0);
    });

    it("should prevent adding a CNAME when other records exist for the same name", () => {
      manager.createRecord({
        domain: "crud.com",
        name: "conflict",
        type: RecordType.A,
        value: "1.1.1.1",
      });

      expect(() =>
        manager.createRecord({
          domain: "crud.com",
          name: "conflict",
          type: RecordType.CNAME,
          value: "target.example.com",
        }),
      ).toThrowError(/Cannot add CNAME/);
    });

    it("should prevent adding records when a CNAME already exists for the name", () => {
      manager.createRecord({
        domain: "crud.com",
        name: "alias",
        type: RecordType.CNAME,
        value: "target.example.com",
      });

      expect(() =>
        manager.createRecord({
          domain: "crud.com",
          name: "alias",
          type: RecordType.A,
          value: "1.1.1.1",
        }),
      ).toThrowError(/CNAME already exists/);
    });

    it("should reject updates with invalid TTL", () => {
      const record = manager.createRecord({
        domain: "crud.com",
        name: "ttl",
        type: RecordType.A,
        value: "10.0.0.1",
      });

      expect(() =>
        manager.updateRecord("crud.com", record.id, { ttl: 5 }),
      ).toThrowError(/TTL must be between/);
    });
  });

  // =========================================================================
  // Email authentication record generation
  // =========================================================================

  describe("SPF record generation", () => {
    beforeEach(() => {
      manager.createZone("spf-test.com");
    });

    it("should generate a valid SPF record with includes and IPs", () => {
      const config: SpfConfig = {
        includes: ["spf.emailed.dev", "_spf.google.com"],
        ipv4: ["203.0.113.5"],
        ipv6: ["2001:db8::1"],
        mechanism: "~all",
      };

      const record = manager.generateSpfRecord("spf-test.com", config);

      expect(record.type).toBe(RecordType.TXT);
      expect(record.value).toContain("v=spf1");
      expect(record.value).toContain("ip4:203.0.113.5");
      expect(record.value).toContain("ip6:2001:db8::1");
      expect(record.value).toContain("include:spf.emailed.dev");
      expect(record.value).toContain("include:_spf.google.com");
      expect(record.value.endsWith("~all")).toBe(true);
    });

    it("should replace existing SPF records when generating a new one", () => {
      const config1: SpfConfig = {
        includes: ["old.example.com"],
        ipv4: [],
        ipv6: [],
        mechanism: "~all",
      };
      manager.generateSpfRecord("spf-test.com", config1);

      const config2: SpfConfig = {
        includes: ["new.example.com"],
        ipv4: [],
        ipv6: [],
        mechanism: "-all",
      };
      manager.generateSpfRecord("spf-test.com", config2);

      // Only the new SPF should exist
      const txtRecords = manager.getRecords("spf-test.com", "@", RecordType.TXT);
      const spfRecords = txtRecords.filter((r) => r.value.startsWith("v=spf1"));
      expect(spfRecords).toHaveLength(1);
      expect(spfRecords[0]!.value).toContain("include:new.example.com");
      expect(spfRecords[0]!.value.endsWith("-all")).toBe(true);
    });
  });

  describe("DKIM record generation", () => {
    beforeEach(() => {
      manager.createZone("dkim-test.com");
    });

    it("should generate a DKIM TXT record with correct selector subdomain", () => {
      const config: DkimConfig = {
        selector: "emailed202604",
        publicKey: "MIIBIjANBgkqhki...",
        algorithm: "rsa-sha256",
        keySize: 2048,
      };

      const record = manager.generateDkimRecord("dkim-test.com", config);

      expect(record.type).toBe(RecordType.TXT);
      expect(record.name).toBe("emailed202604._domainkey");
      expect(record.value).toContain("v=DKIM1");
      expect(record.value).toContain("k=rsa");
      expect(record.value).toContain("p=MIIBIjANBgkqhki...");
    });

    it("should use ed25519 key type for ed25519-sha256 algorithm", () => {
      const config: DkimConfig = {
        selector: "ed25519sel",
        publicKey: "base64edkey==",
        algorithm: "ed25519-sha256",
        keySize: 1024,
      };

      const record = manager.generateDkimRecord("dkim-test.com", config);
      expect(record.value).toContain("k=ed25519");
    });
  });

  describe("DMARC record generation", () => {
    beforeEach(() => {
      manager.createZone("dmarc-test.com");
    });

    it("should generate a DMARC record with all policy options", () => {
      const policy: DmarcPolicy = {
        policy: "reject",
        subdomainPolicy: "quarantine",
        percentage: 100,
        reportUri: "dmarc@dmarc-test.com",
        forensicUri: "forensic@dmarc-test.com",
        alignmentMode: "strict",
        dkimAlignment: "relaxed",
      };

      const record = manager.generateDmarcRecord("dmarc-test.com", policy);

      expect(record.type).toBe(RecordType.TXT);
      expect(record.name).toBe("_dmarc");
      expect(record.value).toContain("v=DMARC1");
      expect(record.value).toContain("p=reject");
      expect(record.value).toContain("sp=quarantine");
      expect(record.value).toContain("pct=100");
      expect(record.value).toContain("rua=mailto:dmarc@dmarc-test.com");
      expect(record.value).toContain("ruf=mailto:forensic@dmarc-test.com");
      expect(record.value).toContain("aspf=s");
      expect(record.value).toContain("adkim=r");
    });

    it("should generate a minimal DMARC record with only required fields", () => {
      const policy: DmarcPolicy = {
        policy: "none",
      };

      const record = manager.generateDmarcRecord("dmarc-test.com", policy);

      expect(record.value).toBe("v=DMARC1; p=none");
    });
  });

  describe("generateEmailAuthRecords (combined)", () => {
    it("should generate SPF, DKIM, DMARC, and MX records in one call", () => {
      manager.createZone("combo.com");

      const result = manager.generateEmailAuthRecords("combo.com", {
        spf: {
          includes: ["spf.emailed.dev"],
          ipv4: [],
          ipv6: [],
          mechanism: "~all",
        },
        dkim: {
          selector: "emailed202604",
          publicKey: "TESTKEY",
          algorithm: "rsa-sha256",
          keySize: 2048,
        },
        dmarc: {
          policy: "quarantine",
          reportUri: "dmarc@combo.com",
        },
        mxRecords: [
          { value: "mx1.emailed.dev", priority: 10 },
          { value: "mx2.emailed.dev", priority: 20 },
        ],
      });

      expect(result.spf.value).toContain("v=spf1");
      expect(result.dkim.value).toContain("v=DKIM1");
      expect(result.dmarc.value).toContain("v=DMARC1");
      expect(result.mx).toHaveLength(2);
      expect(result.mx[0]!.priority).toBe(10);
      expect(result.mx[1]!.priority).toBe(20);
    });
  });

  // =========================================================================
  // Validation
  // =========================================================================

  describe("record validation", () => {
    it("should reject empty domain names", () => {
      const result = manager.validateRecord({
        domain: "",
        name: "@",
        type: RecordType.A,
        value: "1.2.3.4",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Domain"))).toBe(true);
    });

    it("should reject invalid IPv4 addresses", () => {
      manager.createZone("val.com");

      expect(() =>
        manager.createRecord({
          domain: "val.com",
          name: "bad-ip",
          type: RecordType.A,
          value: "999.999.999.999",
        }),
      ).toThrowError(/Invalid/);
    });

    it("should reject TTL values below 60 seconds", () => {
      const result = manager.validateRecord({
        domain: "val.com",
        name: "@",
        type: RecordType.A,
        value: "1.2.3.4",
        ttl: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("TTL"))).toBe(true);
    });

    it("should warn about MX records without priority", () => {
      const result = manager.validateRecord({
        domain: "val.com",
        name: "@",
        type: RecordType.MX,
        value: "mx.example.com",
      });

      // MX without priority should produce a warning, not an error
      expect(result.warnings.some((w) => w.includes("priority"))).toBe(true);
    });
  });
});
