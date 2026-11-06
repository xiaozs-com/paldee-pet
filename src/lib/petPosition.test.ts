import { describe, expect, it } from "vitest";
import { centeredPetPosition, petIntersectsMonitor } from "./petPosition";

const primary = {
  scaleFactor: 1.25,
  workArea: { position: { x: 0, y: 40 }, size: { width: 1920, height: 1040 } },
};
const secondary = {
  scaleFactor: 1.5,
  workArea: {
    position: { x: -2560, y: -200 },
    size: { width: 2560, height: 1400 },
  },
};

describe("pet monitor geometry in physical pixels", () => {
  it("keeps positions on negative-coordinate displays", () => {
    expect(petIntersectsMonitor({ x: -2000, y: -100 }, 160, secondary)).toBe(
      true,
    );
    expect(petIntersectsMonitor({ x: -2000, y: -100 }, 160, primary)).toBe(
      false,
    );
  });
  it("uses the display scale for partial visibility and excludes edge-only contact", () => {
    expect(petIntersectsMonitor({ x: -199, y: 100 }, 160, primary)).toBe(true);
    expect(petIntersectsMonitor({ x: -200, y: 100 }, 160, primary)).toBe(false);
    expect(petIntersectsMonitor({ x: 1920, y: 100 }, 160, primary)).toBe(false);
  });
  it("centers inside the primary work area including taskbar offsets", () => {
    expect(centeredPetPosition(160, primary)).toEqual({ x: 860, y: 460 });
  });
});
