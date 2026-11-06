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

export function petIntersectsMonitor(
  position: PetPoint,
  logicalSize: number,
  monitor: PetMonitor,
): boolean {
  const { position: origin, size } = monitor.workArea;
  const physicalSize = logicalSize * monitor.scaleFactor;
  return (
    position.x < origin.x + size.width &&
    position.x + physicalSize > origin.x &&
    position.y < origin.y + size.height &&
    position.y + physicalSize > origin.y
  );
}

export function centeredPetPosition(
  logicalSize: number,
  monitor: PetMonitor,
): PetPoint {
  const { position, size } = monitor.workArea;
  const physicalSize = logicalSize * monitor.scaleFactor;
  return {
    x: Math.round(position.x + Math.max(0, (size.width - physicalSize) / 2)),
    y: Math.round(position.y + Math.max(0, (size.height - physicalSize) / 2)),
  };
}
