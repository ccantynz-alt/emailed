import { describe, it, expect, beforeEach } from 'bun:test';
import { ReputationEngine } from '../src/scoring/engine.js';
import type { ReputationFactors } from '../src/types.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function makeFactors(overrides: Partial<ReputationFactors> = {}): ReputationFactors {
  return {
    deliveryRate: 0.98,
    bounceRate: 0.01,
    complaintRate: 0.0001,
    spamTrapHits: 0,
    blocklistPresence: 0,
    authenticationScore: 1.0,
    engagementScore: 0.5,
    volumeConsistency: 0.8,
    ageInDays: 180,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Multi-factor calculation
// ---------------------------------------------------------------------------

describe('ReputationEngine - score calculation', () => {
  let engine: ReputationEngine;

  beforeEach(() => {
    engine = new ReputationEngine();
  });

  it('should calculate a high score for excellent factors', () => {
    const result = engine.calculateIpScore('10.0.0.1', makeFactors());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.value.category).toBe('excellent');
    }
  });

  it('should calculate a low score for poor factors', () => {
    const result = engine.calculateIpScore('10.0.0.2', makeFactors({
      deliveryRate: 0.5,
      bounceRate: 0.15,
      complaintRate: 0.005,
      spamTrapHits: 5,
      blocklistPresence: 3,
      authenticationScore: 0.3,
      engagementScore: 0.1,
      volumeConsistency: 0.2,
      ageInDays: 5,
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBeLessThan(50);
      expect(['poor', 'critical']).toContain(result.value.category);
    }
  });

  it('should calculate domain scores the same way as IP scores', () => {
    const factors = makeFactors();
    const ipResult = engine.calculateIpScore('10.0.0.3', factors);
    const domainResult = engine.calculateDomainScore('example.com', factors);
    expect(ipResult.ok && domainResult.ok).toBe(true);
    if (ipResult.ok && domainResult.ok) {
      expect(ipResult.value.overallScore).toBe(domainResult.value.overallScore);
    }
  });

  it('should include contributing signals in the result', () => {
    const result = engine.calculateIpScore('10.0.0.4', makeFactors());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.signals.length).toBeGreaterThan(0);
      const sources = result.value.signals.map((s) => s.source);
      expect(sources).toContain('delivery_rate');
      expect(sources).toContain('bounce_rate');
      expect(sources).toContain('authentication');
    }
  });

  it('should heavily penalize blocklist presence', () => {
    const cleanResult = engine.calculateIpScore('10.0.0.5', makeFactors({ blocklistPresence: 0 }));
    const listedResult = engine.calculateIpScore('10.0.0.6', makeFactors({ blocklistPresence: 3 }));
    expect(cleanResult.ok && listedResult.ok).toBe(true);
    if (cleanResult.ok && listedResult.ok) {
      expect(listedResult.value.overallScore).toBeLessThan(cleanResult.value.overallScore);
    }
  });

  it('should penalize high complaint rates severely', () => {
    const lowComplaint = engine.calculateIpScore('10.0.0.7', makeFactors({ complaintRate: 0.0001 }));
    const highComplaint = engine.calculateIpScore('10.0.0.8', makeFactors({ complaintRate: 0.01 }));
    expect(lowComplaint.ok && highComplaint.ok).toBe(true);
    if (lowComplaint.ok && highComplaint.ok) {
      expect(highComplaint.value.overallScore).toBeLessThan(lowComplaint.value.overallScore);
    }
  });
});

// ---------------------------------------------------------------------------
// Score thresholds / categories
// ---------------------------------------------------------------------------

describe('ReputationEngine - score categories', () => {
  let engine: ReputationEngine;

  beforeEach(() => {
    engine = new ReputationEngine();
  });

  it('should categorize score 95 as excellent', () => {
    const result = engine.calculateIpScore('10.0.0.10', makeFactors({
      deliveryRate: 0.99,
      bounceRate: 0.001,
      complaintRate: 0.00001,
      authenticationScore: 1.0,
      engagementScore: 0.8,
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.category).toBe('excellent');
    }
  });

  it('should categorize very low score as critical', () => {
    const result = engine.calculateIpScore('10.0.0.11', makeFactors({
      deliveryRate: 0.1,
      bounceRate: 0.5,
      complaintRate: 0.1,
      spamTrapHits: 10,
      blocklistPresence: 5,
      authenticationScore: 0.0,
      engagementScore: 0.0,
      ageInDays: 1,
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.category).toBe('critical');
    }
  });
});

// ---------------------------------------------------------------------------
// Trend analysis
// ---------------------------------------------------------------------------

describe('ReputationEngine - trend analysis', () => {
  let engine: ReputationEngine;

  beforeEach(() => {
    engine = new ReputationEngine();
  });

  it('should return error for entity with no history', () => {
    const result = engine.analyzeTrend('10.0.0.20', 'ip');
    expect(result.ok).toBe(false);
  });

  it('should track score history and report trend', () => {
    engine.calculateIpScore('10.0.0.21', makeFactors({ deliveryRate: 0.90 }));
    engine.calculateIpScore('10.0.0.21', makeFactors({ deliveryRate: 0.92 }));
    engine.calculateIpScore('10.0.0.21', makeFactors({ deliveryRate: 0.95 }));

    const trendResult = engine.analyzeTrend('10.0.0.21', 'ip');
    expect(trendResult.ok).toBe(true);
    if (trendResult.ok) {
      expect(trendResult.value.dataPoints).toBe(3);
      expect(trendResult.value.currentScore).toBeGreaterThan(0);
    }
  });

  it('should return history entries via getHistory', () => {
    engine.calculateIpScore('10.0.0.22', makeFactors());
    engine.calculateIpScore('10.0.0.22', makeFactors({ deliveryRate: 0.8 }));
    const history = engine.getHistory('10.0.0.22', 'ip');
    expect(history.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

describe('ReputationEngine - alerts', () => {
  let engine: ReputationEngine;

  beforeEach(() => {
    engine = new ReputationEngine({
      alertThresholds: {
        scoreDropThreshold: 50,
        suddenDropThreshold: 15,
        criticalCategoryAlert: true,
      },
    });
  });

  it('should generate alert when score drops below threshold', () => {
    // First calc with good score
    engine.calculateIpScore('10.0.0.30', makeFactors());
    // Second calc with bad score
    engine.calculateIpScore('10.0.0.30', makeFactors({
      deliveryRate: 0.3,
      bounceRate: 0.3,
      complaintRate: 0.01,
      spamTrapHits: 5,
      blocklistPresence: 3,
      authenticationScore: 0.1,
    }));

    const alerts = engine.drainAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some((a) => a.alertType === 'score_drop' || a.alertType === 'sudden_drop')).toBe(true);
  });

  it('should drain alerts and clear the queue', () => {
    engine.calculateIpScore('10.0.0.31', makeFactors());
    engine.calculateIpScore('10.0.0.31', makeFactors({
      deliveryRate: 0.1, bounceRate: 0.5, complaintRate: 0.1,
      spamTrapHits: 10, blocklistPresence: 5, authenticationScore: 0.0,
    }));
    const first = engine.drainAlerts();
    expect(first.length).toBeGreaterThan(0);
    const second = engine.drainAlerts();
    expect(second.length).toBe(0);
  });

  it('should allow peeking at alerts without draining', () => {
    engine.calculateIpScore('10.0.0.32', makeFactors());
    engine.calculateIpScore('10.0.0.32', makeFactors({
      deliveryRate: 0.1, bounceRate: 0.5, complaintRate: 0.1,
      spamTrapHits: 10, blocklistPresence: 5, authenticationScore: 0.0,
    }));
    const peeked = engine.peekAlerts();
    expect(peeked.length).toBeGreaterThan(0);
    // Peeking should not clear
    const peekedAgain = engine.peekAlerts();
    expect(peekedAgain.length).toBe(peeked.length);
  });
});
