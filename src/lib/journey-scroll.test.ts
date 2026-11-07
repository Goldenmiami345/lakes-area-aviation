import { describe, expect, it } from "vitest";
import { JOURNEY_HOLD, JOURNEY_TAIL, journeyFrame, journeyAltitude, maxSettleDistance, pinnedLength, settleTarget, stageLanding, stageLengthFrom, stagePosition } from "./journey-scroll";

const g = { base: 1000, stage: 800, count: 6 };
const at = (stageUnits: number) => g.base + stageUnits * g.stage;

describe("geometry", () => {
  it("pinned length and stage length are inverses", () => {
    const vh = 844;
    const section = pinnedLength(g.stage, g.count) + vh;
    expect(stageLengthFrom(section, vh, g.count)).toBeCloseTo(g.stage, 6);
  });
  it("clamps position to the pinned range", () => {
    expect(stagePosition(g, g.base - 500)).toBe(0);
    expect(stagePosition(g, at(99))).toBeCloseTo(g.count - 1 + JOURNEY_TAIL, 9);
  });
});

describe("journeyFrame", () => {
  it("shows a stage unchanged through its whole hold", () => {
    for (const k of [0, 1, 4]) {
      for (const f of [0, 0.25, JOURNEY_HOLD - 1e-6]) {
        const fr = journeyFrame(g, at(k + f));
        expect(fr.stage).toBe(k);
        expect(fr.transition).toBe(0);
        expect(fr.active).toBe(k);
        expect(fr.copyOpacity).toBe(1);
      }
    }
  });
  it("crossfades monotonically from hold end to the next stage", () => {
    let prev = -1;
    for (let f = JOURNEY_HOLD; f <= 1; f += 0.01) {
      const fr = journeyFrame(g, at(2 + f));
      expect(fr.stage).toBe(2);
      expect(fr.transition).toBeGreaterThanOrEqual(prev);
      prev = fr.transition;
    }
    expect(journeyFrame(g, at(2.9999)).transition).toBeCloseTo(1, 6);
    expect(journeyFrame(g, at(3)).transition).toBe(0);
    expect(journeyFrame(g, at(3)).stage).toBe(3);
  });
  it("switches the active stage at the midpoint of the crossfade", () => {
    const mid = JOURNEY_HOLD + (1 - JOURNEY_HOLD) / 2;
    expect(journeyFrame(g, at(2 + mid - 0.01)).active).toBe(2);
    expect(journeyFrame(g, at(2 + mid + 0.01)).active).toBe(3);
  });
  it("holds the last stage through the tail with no crossfade", () => {
    for (const f of [0, 0.5, JOURNEY_TAIL, 5]) {
      const fr = journeyFrame(g, at(g.count - 1 + f));
      expect(fr.stage).toBe(g.count - 1);
      expect(fr.transition).toBe(0);
      expect(fr.progress).toBe(1);
    }
  });
  it("progress runs 0→1 across the stages", () => {
    expect(journeyFrame(g, g.base).progress).toBe(0);
    expect(journeyFrame(g, at(2.5)).progress).toBeCloseTo(0.5, 9);
  });
  it("copes with a single-stage journey", () => {
    const fr = journeyFrame({ ...g, count: 1 }, at(0.5));
    expect(fr).toMatchObject({ stage: 0, next: 0, transition: 0, active: 0, progress: 1 });
  });
});

describe("settleTarget", () => {
  it("never moves a rest position inside a hold (any swipe length that ends in a hold stands)", () => {
    for (const k of [0, 1, 2, 5]) for (const f of [0, 0.1, 0.5, JOURNEY_HOLD]) expect(settleTarget(g, at(k + f))).toBeNull();
  });
  it("leaves the hero, the section edges and the tail alone", () => {
    expect(settleTarget(g, g.base - 300)).toBeNull();
    expect(settleTarget(g, g.base)).toBeNull();
    expect(settleTarget(g, at(g.count - 1))).toBeNull();
    expect(settleTarget(g, at(g.count - 1 + JOURNEY_TAIL / 2))).toBeNull();
    expect(settleTarget(g, at(g.count + 3))).toBeNull();
  });
  it("finishes a crossfade toward its nearer edge", () => {
    const w = 1 - JOURNEY_HOLD;
    expect(settleTarget(g, at(1 + JOURNEY_HOLD + w * 0.2))).toBe(Math.round(at(1 + JOURNEY_HOLD)));
    expect(settleTarget(g, at(1 + JOURNEY_HOLD + w * 0.8))).toBe(Math.round(at(2)));
  });
  it("never moves the page more than half a crossfade window", () => {
    const edge = 2 / g.stage;
    for (let f = JOURNEY_HOLD + edge; f < 1 - edge; f += 0.001) {
      const y = at(3 + f);
      const t = settleTarget(g, y);
      expect(t).not.toBeNull();
      expect(Math.abs((t as number) - y)).toBeLessThanOrEqual(maxSettleDistance(g.stage) + 1);
    }
  });
  it("treats a position within a pixel of a window edge as at rest", () => {
    expect(settleTarget(g, at(2 + JOURNEY_HOLD) + 0.5)).toBeNull();
    expect(settleTarget(g, at(3) - 0.5)).toBeNull();
  });
  it("is idempotent: a settled position needs no further settling", () => {
    for (let f = JOURNEY_HOLD + 2 / g.stage; f < 1 - 2 / g.stage; f += 0.01) {
      const t = settleTarget(g, at(2 + f)) as number;
      expect(settleTarget(g, t)).toBeNull();
      expect(journeyFrame(g, t).transition === 0 || journeyFrame(g, t).transition === 1).toBe(true);
    }
  });
});

describe("stageLanding", () => {
  it("lands in the middle of a hold so small wobbles change nothing", () => {
    for (let k = 0; k < g.count - 1; k += 1) {
      const y = stageLanding(g, k);
      expect(journeyFrame(g, y)).toMatchObject({ stage: k, transition: 0 });
      expect(journeyFrame(g, y - g.stage * 0.3)).toMatchObject({ stage: k, transition: 0 });
      expect(journeyFrame(g, y + g.stage * 0.3)).toMatchObject({ stage: k, transition: 0 });
    }
  });
  it("lands the last stage inside its tail", () => {
    const y = stageLanding(g, g.count - 1);
    expect(journeyFrame(g, y)).toMatchObject({ stage: g.count - 1, transition: 0 });
    expect(y).toBeGreaterThan(at(g.count - 1));
    expect(y).toBeLessThan(at(g.count - 1 + JOURNEY_TAIL));
  });
  it("clamps out-of-range indexes", () => {
    expect(stageLanding(g, -4)).toBe(stageLanding(g, 0));
    expect(stageLanding(g, 99)).toBe(stageLanding(g, g.count - 1));
  });
});

describe("altitude", () => {
  it("rests on round thousands and counts only during a crossfade", () => {
    expect(journeyAltitude(journeyFrame(g, at(0)), g.count)).toBe(0);
    expect(journeyAltitude(journeyFrame(g, at(1)), g.count)).toBe(7000);
    expect(journeyAltitude(journeyFrame(g, at(5)), g.count)).toBe(35000);
    const mid = journeyAltitude(journeyFrame(g, at(1 + JOURNEY_HOLD + (1 - JOURNEY_HOLD) / 2)), g.count);
    expect(mid).toBeGreaterThan(7000);
    expect(mid).toBeLessThan(14000);
  });
});
