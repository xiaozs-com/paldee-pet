import { describe, expect, it } from "vitest";
import { clampPetPosition } from "./petPosition";

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

describe("clampPetPosition in physical pixels", () => {
  it("preserves positions that fully fit the monitor", () => {
    expect(clampPetPosition({ x: 120, y: 240 }, 160, [primary])).toEqual({
      x: 120,
      y: 240,
    });
  });
  it("subtracts the 125% physical size from the right and bottom work-area edges", () => {
    expect(clampPetPosition({ x: 1900, y: 1050 }, 160, [primary])).toEqual({
      x: 1720,
      y: 880,
    });
  });
  it("clamps partial visibility and fully off-screen positions to the closest edge", () => {
    expect(clampPetPosition({ x: -199, y: 100 }, 160, [primary])).toEqual({
      x: 0,
      y: 100,
    });
    expect(clampPetPosition({ x: -9999, y: -9999 }, 160, [primary])).toEqual({
      x: 0,
      y: 40,
    });
  });
  it("preserves negative coordinates on an attached secondary display", () => {
    expect(
      clampPetPosition({ x: -2000, y: -100 }, 160, [primary, secondary]),
    ).toEqual({ x: -2000, y: -100 });
  });
  it("chooses the nearest display using its own scale and work area", () => {
    expect(
      clampPetPosition({ x: -9999, y: -100 }, 160, [primary, secondary]),
    ).toEqual({ x: -2560, y: -100 });
    expect(
      clampPetPosition({ x: -200, y: 100 }, 160, [primary, secondary]),
    ).toEqual({ x: -240, y: 100 });
  });
  it("keeps the closest surviving screen after unplugging a display", () => {
    expect(clampPetPosition({ x: -1800, y: 200 }, 160, [primary])).toEqual({
      x: 0,
      y: 200,
    });
  });
  it("leaves the position unchanged when no monitor is available", () => {
    expect(clampPetPosition({ x: -1800, y: 200 }, 160, [])).toEqual({
      x: -1800,
      y: 200,
    });
  });
});
