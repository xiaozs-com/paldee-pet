export interface PetPoint {
  x: number;
  y: number;
}

export interface PetMonitor {
  scaleFactor: number;
  workArea: {
    position: PetPoint;
    size: { width: number; height: number };
  };
}

export function clampPetPosition(
  position: PetPoint,
  logicalSize: number,
  monitors: PetMonitor[],
): PetPoint {
  let closest = position;
  let distance = Infinity;
  for (const monitor of monitors) {
    const { position: origin, size } = monitor.workArea;
    const physicalSize = Math.round(logicalSize * monitor.scaleFactor);
    const candidate = {
      x: Math.min(
        Math.max(origin.x, origin.x + size.width - physicalSize),
        Math.max(origin.x, position.x),
      ),
      y: Math.min(
        Math.max(origin.y, origin.y + size.height - physicalSize),
        Math.max(origin.y, position.y),
      ),
    };
    const candidateDistance = Math.hypot(
      candidate.x - position.x,
      candidate.y - position.y,
    );
    if (candidateDistance < distance) {
      closest = candidate;
      distance = candidateDistance;
    }
  }
  return closest;
}
