import { useEffect, useRef, useState } from "react";

import MascotImage from "../components/MascotImage";
import { DEFAULT_APP_CONFIG, MASCOT_SRC } from "../lib/configLogic";
import { showPetContextMenu } from "../lib/petContextMenu";
import { clampPetPosition, type PetMonitor } from "../lib/petPosition";
import { tauriApi } from "../lib/tauriApi";
import {
  clearPetWebviewChrome,
  getPetWebviewWindow,
  getPetDesktop,
  onPetWebviewScaleChanged,
  onPetWebviewFocusChanged,
  onPetWebviewMoved,
  petSupportsManualMotion,
  setPetWebviewLogicalSize,
  setPetWebviewPosition,
  startPetWebviewDrag,
} from "../lib/tauriWebviewApi";
import type { AppConfig, MascotId } from "../lib/types";

const CLICK_MOVE_THRESHOLD = 4;
const MIN_PET_SIZE = 80;
const MAX_PET_SIZE = 224;
const GLIDE_STOP_SPEED = 0.02;
const GLIDE_MAX_SPEED = 1.4;
const GLIDE_FRICTION_PER_FRAME = 0.88;

interface PointerSample {
  x: number;
  y: number;
  time: number;
}

function clearPetSelection() {
  window.getSelection()?.removeAllRanges();
}

function clampPetSize(size: number) {
  return Math.min(MAX_PET_SIZE, Math.max(MIN_PET_SIZE, Math.round(size)));
}

export default function PetWindow() {
  const [mascotId, setMascotId] = useState<MascotId>(
    DEFAULT_APP_CONFIG.mascotId,
  );
  const configRef = useRef<AppConfig>(DEFAULT_APP_CONFIG);
  const pointerDownRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const scaleFactorRef = useRef(1);
  const monitorsRef = useRef<PetMonitor[]>([]);
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  const observedPositionRef = useRef({ x: 0, y: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const pointerSamplesRef = useRef<PointerSample[]>([]);
  const glideFrameRef = useRef<number | null>(null);
  const petSizeRef = useRef(DEFAULT_APP_CONFIG.petSize);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, size: 160 });
  const movedSincePointerDownRef = useRef(false);
  const dragStartedRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const positionSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastOpenAtRef = useRef(0);

  useEffect(() => {
    const appWindow = getPetWebviewWindow();
    let disposed = false;
    const unlisteners: Array<() => void> = [];

    const registerUnlistener = (unlisten: () => void) => {
      if (disposed) {
        unlisten();
      } else {
        unlisteners.push(unlisten);
      }
    };

    const initialize = async () => {
      await clearPetWebviewChrome(appWindow);

      const config = await tauriApi.loadConfig().catch((error) => {
        console.error("加载宠物配置失败", error);
        return DEFAULT_APP_CONFIG;
      });
      if (disposed) return;

      configRef.current = config;
      setMascotId(config.mascotId);
      petSizeRef.current = clampPetSize(config.petSize);
      await setPetWebviewLogicalSize(petSizeRef.current);

      const desktop = await getPetDesktop();
      if (disposed) return;
      scaleFactorRef.current = desktop.scaleFactor;
      monitorsRef.current = desktop.monitors;
      const savedPosition =
        config.petX !== null && config.petY !== null
          ? { x: config.petX, y: config.petY }
          : desktop.position;
      const position = clampPetPosition(
        savedPosition,
        petSizeRef.current,
        desktop.monitors,
      );
      if (position.x !== savedPosition.x || position.y !== savedPosition.y) {
        await tauriApi.patchConfig({ petX: position.x, petY: position.y });
      }
      lastPositionRef.current = position;
      observedPositionRef.current = position;
      await onPetWebviewScaleChanged((scaleFactor) => {
        scaleFactorRef.current = scaleFactor;
        void getPetDesktop()
          .then((updated) => {
            if (!disposed) monitorsRef.current = updated.monitors;
          })
          .catch((error) => console.error("更新显示器工作区失败", error));
      }).then(registerUnlistener);
      if (disposed) return;
      await setPetWebviewPosition(position.x, position.y);
      if (disposed) return;

      await tauriApi
        .listenMascotChanged((payload) => {
          configRef.current = { ...configRef.current, mascotId: payload };
          setMascotId(payload);
        })
        .then(registerUnlistener)
        .catch((error) => console.error("监听宠物切换失败", error));
      if (disposed) return;

      await onPetWebviewFocusChanged(() => {
        void clearPetWebviewChrome(appWindow);
      })
        .then(registerUnlistener)
        .catch((error) => console.error("监听宠物焦点失败", error));
      if (disposed) return;

      await onPetWebviewMoved((position) => {
        if (pointerDownRef.current) {
          movedSincePointerDownRef.current = true;
        }

        const updatedConfig = {
          ...configRef.current,
          petX: position.x,
          petY: position.y,
        };
        observedPositionRef.current = position;
        lastPositionRef.current = position;
        configRef.current = updatedConfig;
        if (positionSaveTimerRef.current !== null) {
          clearTimeout(positionSaveTimerRef.current);
        }
        positionSaveTimerRef.current = setTimeout(() => {
          positionSaveTimerRef.current = null;
          saveQueueRef.current = saveQueueRef.current
            .then(() =>
              tauriApi.patchConfig({
                petX: position.x,
                petY: position.y,
              }),
            )
            .catch((error) => console.error("保存宠物位置失败", error));
        }, 120);
      })
        .then(registerUnlistener)
        .catch((error) => console.error("监听宠物位置失败", error));

      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          void clearPetWebviewChrome(appWindow);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      registerUnlistener(() =>
        document.removeEventListener("visibilitychange", onVisibility),
      );
    };

    const onSelectStart = (event: Event) => event.preventDefault();
    document.addEventListener("selectstart", onSelectStart);
    registerUnlistener(() =>
      document.removeEventListener("selectstart", onSelectStart),
    );

    void initialize();

    return () => {
      disposed = true;
      if (glideFrameRef.current !== null) {
        cancelAnimationFrame(glideFrameRef.current);
      }
      if (positionSaveTimerRef.current !== null) {
        clearTimeout(positionSaveTimerRef.current);
      }
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    if (glideFrameRef.current !== null) {
      cancelAnimationFrame(glideFrameRef.current);
      glideFrameRef.current = null;
    }
    clearPetSelection();
    void getPetDesktop()
      .then((updated) => {
        monitorsRef.current = updated.monitors;
      })
      .catch((error) => console.error("更新显示器工作区失败", error));
    pointerDownRef.current = true;
    movedSincePointerDownRef.current = false;
    dragStartedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    grabOffsetRef.current = { x: event.clientX, y: event.clientY };
    pointerSamplesRef.current = [
      { ...lastPositionRef.current, time: performance.now() },
    ];
    if (petSupportsManualMotion() && event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!pointerDownRef.current) return;

    const distance = Math.hypot(
      event.clientX - pointerStartRef.current.x,
      event.clientY - pointerStartRef.current.y,
    );
    if (distance <= CLICK_MOVE_THRESHOLD && !dragStartedRef.current) return;

    movedSincePointerDownRef.current = true;
    if (petSupportsManualMotion()) {
      dragStartedRef.current = true;
      const position = clampPetPosition(
        {
          x:
            observedPositionRef.current.x +
            (event.clientX - grabOffsetRef.current.x) * scaleFactorRef.current,
          y:
            observedPositionRef.current.y +
            (event.clientY - grabOffsetRef.current.y) * scaleFactorRef.current,
        },
        petSizeRef.current,
        monitorsRef.current,
      );
      lastPositionRef.current = position;
      const now = performance.now();
      pointerSamplesRef.current = [
        ...pointerSamplesRef.current.filter(
          (sample) => now - sample.time <= 100,
        ),
        { ...position, time: now },
      ].slice(-6);
      void setPetWebviewPosition(position.x, position.y);
      return;
    }
    if (dragStartedRef.current) return;
    dragStartedRef.current = true;
    void startPetWebviewDrag();
  };

  const startGlide = () => {
    const samples = pointerSamplesRef.current;
    if (samples.length < 2) return;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const elapsed = Math.max(1, last.time - first.time);
    let vx = (last.x - first.x) / elapsed;
    let vy = (last.y - first.y) / elapsed;
    const speed = Math.hypot(vx, vy);
    if (speed < GLIDE_STOP_SPEED) return;
    if (speed > GLIDE_MAX_SPEED) {
      const scale = GLIDE_MAX_SPEED / speed;
      vx *= scale;
      vy *= scale;
    }

    let previousTime = performance.now();
    const step = (now: number) => {
      const elapsedMs = Math.min(32, now - previousTime);
      previousTime = now;
      const friction = Math.pow(
        GLIDE_FRICTION_PER_FRAME,
        elapsedMs / (1000 / 60),
      );
      vx *= friction;
      vy *= friction;
      const requested = {
        x: lastPositionRef.current.x + vx * elapsedMs,
        y: lastPositionRef.current.y + vy * elapsedMs,
      };
      const position = clampPetPosition(
        requested,
        petSizeRef.current,
        monitorsRef.current,
      );
      if (position.x !== requested.x) vx = 0;
      if (position.y !== requested.y) vy = 0;
      lastPositionRef.current = position;
      void setPetWebviewPosition(position.x, position.y);

      if (Math.hypot(vx, vy) > GLIDE_STOP_SPEED) {
        glideFrameRef.current = requestAnimationFrame(step);
      } else {
        glideFrameRef.current = null;
        void clearPetWebviewChrome(getPetWebviewWindow());
      }
    };
    glideFrameRef.current = requestAnimationFrame(step);
  };

  const endPointer = (event: React.PointerEvent<HTMLElement>) => {
    if (dragStartedRef.current) {
      void clearPetWebviewChrome(getPetWebviewWindow());
      if (petSupportsManualMotion()) {
        startGlide();
      }
    }
    pointerDownRef.current = false;
    dragStartedRef.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (glideFrameRef.current !== null) {
      cancelAnimationFrame(glideFrameRef.current);
      glideFrameRef.current = null;
    }
    resizingRef.current = true;
    resizeStartRef.current = {
      x: event.screenX,
      y: event.screenY,
      size: petSizeRef.current,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleResizePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!resizingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const delta = Math.max(
      event.screenX - resizeStartRef.current.x,
      event.screenY - resizeStartRef.current.y,
    );
    const size = clampPetSize(resizeStartRef.current.size + delta);
    if (size === petSizeRef.current) return;
    petSizeRef.current = size;
    void setPetWebviewLogicalSize(size);
  };

  const endResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    resizingRef.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const petSize = petSizeRef.current;
    configRef.current = { ...configRef.current, petSize };
    void tauriApi
      .patchConfig({ petSize })
      .catch((error) => console.error("保存宠物大小失败", error));
  };

  const handleClick = () => {
    pointerDownRef.current = false;
    clearPetSelection();
    if (movedSincePointerDownRef.current) return;

    const now = Date.now();
    if (now - lastOpenAtRef.current < 400) return;
    lastOpenAtRef.current = now;

    void tauriApi
      .showChatNearPet()
      .catch((error) => console.error("打开聊天窗口失败", error));
  };

  return (
    <main
      className="pet-window"
      data-testid="pet-drag-region"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerCancel={endPointer}
      onPointerUp={endPointer}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        clearPetSelection();
      }}
      onDragStart={(event) => event.preventDefault()}
      onClick={handleClick}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void showPetContextMenu().catch((error) =>
          console.error("打开桌宠菜单失败", error),
        );
      }}
    >
      <MascotImage src={MASCOT_SRC[mascotId]} />
      <button
        className="pet-resize-handle"
        type="button"
        aria-label="调整宠物大小"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      />
    </main>
  );
}
