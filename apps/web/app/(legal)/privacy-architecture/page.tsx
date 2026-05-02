import type { Metadata } from "next";
import { Box, Text, Card, CardContent } from "@alecrae/ui";

export const metadata: Metadata = {
  title: "Privacy Architecture | AlecRae",
  description:
    "How AlecRae's architecture physically prevents data mining, ad targeting, and AI training on your email. The technical complement to our Privacy Policy.",
};

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box className="mb-10">
      <Text as="h2" className="text-xl font-bold text-content mb-4">
        {number}. {title}
      </Text>
      <Box className="space-y-3 text-content-secondary leading-relaxed">
        {children}
      </Box>
    </Box>
  );
}

interface ComparisonRow {
  capability: string;
  workspace: string;
  outlook: string;
  alecrae: string;
  alecraeWin: boolean;
}

const COMPARISON: ComparisonRow[] = [
  {
    capability: "Email content used to train ad-targeting models",
    workspace: "Yes (consumer Gmail)",
    outlook: "Yes (telemetry on by default)",
    alecrae: "Architecturally impossible — no ads, no trackers",
    alecraeWin: true,
  },
  {
    capability: "Email content used to train AI models",
    workspace: "Yes unless customer opts out",
    outlook: "Yes unless customer opts out",
    alecrae: "Never. Voice profile is per-account, never aggregated",
    alecraeWin: true,
  },
  {
    capability: "AI inference location",
    workspace: "Google Cloud only",
    outlook: "Microsoft Cloud only",
    alecrae: "Your GPU first, edge second, cloud only when needed",
    alecraeWin: true,
  },
  {
    capability: "Per-token AI cost passed to user",
    workspace: "$30/user/mo (Gemini Advanced add-on)",
    outlook: "$30/user/mo (Copilot Pro add-on)",
    alecrae: "$0 — bundled and runs on your hardware",
    alecraeWin: true,
  },
  {
    capability: "Email body encrypted at rest with user-held keys",
    workspace: "No — Google holds keys",
    outlook: "No — Microsoft holds keys",
    alecrae: "Yes — RSA-OAEP-4096 + AES-256-GCM via Web Crypto API",
    alecraeWin: true,
  },
  {
    capability: "Inbox readable when offline",
    workspace: "Limited offline cache",
    outlook: "Limited offline cache",
    alecrae: "Full local-first via IndexedDB; works offline by default",
    alecraeWin: true,
  },
  {
    capability: "Third-party JavaScript trackers",
    workspace: "Multiple (advertising, analytics)",
    outlook: "Multiple (advertising, telemetry)",
    alecrae: "Zero. Architecturally banned in CLAUDE.md",
    alecraeWin: true,
  },
  {
    capability: "Sender side data residency",
    workspace: "US/EU regions, customer-selectable",
    outlook: "US/EU regions, customer-selectable",
    alecrae: "Edge-distributed; control plane in user-chosen region",
    alecraeWin: false,
  },
  {
    capability: "Independent security audits published",
    workspace: "SOC 2, ISO 27001 (private)",
    outlook: "SOC 2, ISO 27001 (private)",
    alecrae: "SOC 2 in progress, full reports public when complete",
    alecraeWin: false,
  },
  {
    capability: "Source code auditable",
    workspace: "No",
    outlook: "No",
    alecrae: "Client open-sourcing on the v1.x roadmap",
    alecraeWin: false,
  },
];

function ArchPrinciple({ title, body }: { title: string; body: string }) {
  return (
    <Card className="mb-3">
      <CardContent>
        <Text variant="body-md" className="font-semibold mb-2">
          {title}
        </Text>
        <Text variant="body-sm" muted className="leading-relaxed">
          {body}
        </Text>
      </CardContent>
    </Card>
  );
}

export default function PrivacyArchitecturePage() {
  return (
    <Box className="max-w-4xl mx-auto">
      <Box className="mb-10">
        <Text as="h1" className="text-3xl font-bold text-content mb-2">
          Privacy Architecture
        </Text>
        <Text className="text-content-tertiary">
          How AlecRae&apos;s system design physically prevents the things you
          have to <em>trust</em> Google or Microsoft not to do.
        </Text>
      </Box>

      <Section number="0" title="Why architecture beats policy">
        <Text>
          Google&apos;s privacy policy says they don&apos;t use enterprise
          Workspace email content to train consumer ad models. Microsoft says
          their Copilot doesn&apos;t train on your tenant. Both statements may
          be true today. Both can change with a future Terms of Service update,
          a new sub-processor disclosure, or a regulatory carve-out you have to
          opt out of.
        </Text>
        <Text>
          AlecRae takes a different approach: the system is built so that the
          privacy-violating action <strong>can&apos;t happen at all</strong>,
          regardless of what a future Terms of Service might say. Local AI
          can&apos;t mine email at scale because the prompts never leave the
          device. End-to-end encryption can&apos;t be silently disabled because
          the keys live on the user&apos;s hardware. No third-party trackers
          can leak data because the codebase forbids the dependency.
        </Text>
        <Text>
          This page documents those architectural guarantees. The legal
          version of these commitments lives in our{" "}
          <Box as="a" href="/privacy" className="text-brand-600 underline">
            Privacy Policy
          </Box>
          ; this page is the engineering complement.
        </Text>
      </Section>

      <Section number="1" title="The three-tier compute model">
        <Text>
          AlecRae routes every AI request through three tiers, in order:
        </Text>
        <ArchPrinciple
          title="Tier 1 — Client GPU (WebGPU)"
          body="Llama 3.1/3.2 runs in the user's browser via WebGPU. Prompts and outputs never leave the device. Used for grammar checks, short replies, summaries, and translations. Cost to AlecRae: $0/token. Cost to user privacy: zero — there is no network call."
        />
        <ArchPrinciple
          title="Tier 2 — Edge (Cloudflare Workers)"
          body="Lightweight inference at sub-50ms global latency. Used when the local model isn't loaded or for tasks that exceed local capability. Workers run in 330+ cities; data stays in the user's region by default."
        />
        <ArchPrinciple
          title="Tier 3 — Cloud (Claude API)"
          body="Heavy reasoning (overnight inbox agent, voice profile training, long compositions). Only used when Tiers 1 and 2 can't satisfy the request. Anthropic's enterprise terms apply: zero training on submitted data."
        />
        <Text>
          The platform decides which tier to use based on cost, latency, and
          capability. The user never sees the tier. They just see speed.
        </Text>
      </Section>

      <Section number="2" title="Zero-knowledge encryption">
        <Text>
          When a user enables end-to-end encryption on a thread or account,
          AlecRae generates an asymmetric keypair using the browser&apos;s
          native Web Crypto API. The public key is stored on our servers; the
          private key never leaves the device. Email bodies are encrypted with
          AES-256-GCM under a per-message symmetric key, which is then wrapped
          with the recipient&apos;s public key (RSA-OAEP-4096).
        </Text>
        <Text>
          Result: an AlecRae employee with full database access cannot read an
          encrypted email body. A subpoena cannot compel us to decrypt
          something we cannot decrypt. A future model trainer cannot use these
          messages because the bytes on disk are random-looking ciphertext.
        </Text>
      </Section>

      <Section number="3" title="Local-first storage">
        <Text>
          The inbox is mirrored into IndexedDB on the user&apos;s device. Reads
          go to local storage first; the network is a sync layer, not a
          dependency. This produces sub-100ms inbox loads but also means the
          user&apos;s daily email surface lives on their hardware, not on
          ours. If our servers go down, AlecRae still works.
        </Text>
        <Text>
          The flip side: cached email never goes through Google&apos;s ad
          pipeline because it&apos;s never on Google&apos;s servers. It never
          gets indexed for cross-product personalization because we don&apos;t
          have other products to personalize.
        </Text>
      </Section>

      <Section number="4" title="The Forbidden List (excerpts from CLAUDE.md)">
        <Text>
          Our internal codebase rules — published verbatim, enforced in code
          review and CI — include the following architectural prohibitions:
        </Text>
        <Box as="ul" className="ml-6 list-disc space-y-2 mt-2">
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">No external JavaScript trackers.</Text>{" "}
              No Google Analytics, no Hotjar, no Mixpanel-as-default. Adding
              one fails CI.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">No selling user data.</Text>{" "}
              Period. This is the moat.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">No ads in the email client.</Text>{" "}
              We&apos;re not Gmail.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">No localStorage for sensitive data.</Text>{" "}
              IndexedDB with encryption only.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">No deletion of user data without 30-day soft-delete window.</Text>{" "}
              Recovery is always possible.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">No use of competitor-owned testing libraries.</Text>{" "}
              Playwright (Microsoft / Outlook) and Puppeteer (Google / Gmail)
              are forbidden — adding them fails CI. We use GateTest.ai for
              quality gates.
            </Text>
          </Box>
        </Box>
      </Section>

      <Section number="5" title="How we compare">
        <Text>
          A side-by-side of the architectural commitments that show up in
          procurement reviews:
        </Text>
        <Box className="mt-4 overflow-x-auto rounded-md border border-border">
          <Box as="table" className="w-full text-sm">
            <Box as="thead" className="bg-surface-secondary">
              <Box as="tr">
                <Box
                  as="th"
                  className="text-left p-3 font-semibold border-b border-border"
                >
                  Capability
                </Box>
                <Box
                  as="th"
                  className="text-left p-3 font-semibold border-b border-border"
                >
                  Google Workspace
                </Box>
                <Box
                  as="th"
                  className="text-left p-3 font-semibold border-b border-border"
                >
                  Microsoft 365
                </Box>
                <Box
                  as="th"
                  className="text-left p-3 font-semibold border-b border-border"
                >
                  AlecRae
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {COMPARISON.map((row, i) => (
                <Box
                  as="tr"
                  key={i}
                  className={i % 2 === 0 ? "bg-surface" : "bg-surface-secondary/30"}
                >
                  <Box as="td" className="p-3 align-top font-medium">
                    {row.capability}
                  </Box>
                  <Box as="td" className="p-3 align-top text-content-secondary">
                    {row.workspace}
                  </Box>
                  <Box as="td" className="p-3 align-top text-content-secondary">
                    {row.outlook}
                  </Box>
                  <Box
                    as="td"
                    className={`p-3 align-top ${row.alecraeWin ? "text-status-success font-medium" : "text-content"}`}
                  >
                    {row.alecrae}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        <Text variant="caption" muted className="mt-3 block">
          Last updated 2026-05-02. Sourced from public documentation, vendor
          DPAs, and our own engineering commitments. We will correct factual
          errors within 7 days of notification — email{" "}
          <Box
            as="a"
            href="mailto:legal@alecrae.com"
            className="text-brand-600 underline"
          >
            legal@alecrae.com
          </Box>
          .
        </Text>
      </Section>

      <Section number="6" title="How to verify any of this">
        <Box as="ul" className="ml-6 list-disc space-y-2">
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">Audit our wire traffic.</Text>{" "}
              Open DevTools → Network. When local AI is enabled (
              <Box
                as="a"
                href="/local-ai"
                className="text-brand-600 underline"
              >
                /local-ai
              </Box>
              ), zero requests leave the browser for grammar / short reply /
              summarize calls.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">Read the codebase.</Text>{" "}
              Client open-sourcing is on the v1.x roadmap. The CLAUDE.md
              forbidden list is excerpted here verbatim.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">Verify our security disclosure.</Text>{" "}
              <Box
                as="a"
                href="/.well-known/security.txt"
                className="text-brand-600 underline"
              >
                /.well-known/security.txt
              </Box>{" "}
              follows RFC 9116. Reports go to{" "}
              <Box
                as="a"
                href="mailto:security@alecrae.com"
                className="text-brand-600 underline"
              >
                security@alecrae.com
              </Box>{" "}
              with a documented response window.
            </Text>
          </Box>
          <Box as="li">
            <Text as="span">
              <Text as="span" className="font-semibold">Check our subprocessors.</Text>{" "}
              Listed in full at{" "}
              <Box
                as="a"
                href="/subprocessors"
                className="text-brand-600 underline"
              >
                /subprocessors
              </Box>
              . Material changes are notified to enterprise customers 30 days
              in advance per our DPA.
            </Text>
          </Box>
        </Box>
      </Section>

      <Section number="7" title="The bottom line">
        <Text>
          The vendors we replace ask you to <em>trust</em> them not to mine
          your email, train on your data, or share with advertisers. AlecRae
          asks you to <em>verify</em> it instead. The architecture either
          permits a behavior or it doesn&apos;t, and the things our customers
          care about — local AI, encrypted storage, no trackers — sit firmly
          in the &ldquo;doesn&apos;t&rdquo; column.
        </Text>
        <Text>
          We can&apos;t change Google&apos;s business model or Microsoft&apos;s
          telemetry stack. We can build something that doesn&apos;t need
          either to work, and we have. That&apos;s the pitch.
        </Text>
      </Section>
    </Box>
  );
}
