// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_APP_CONFIG } from "../lib/configLogic";
import PetWindow from "./PetWindow";

const mocks = vi.hoisted(() => ({
  loadConfig: vi.fn(),
  patchConfig: vi.fn(),
  showChatNearPet: vi.fn(),
  showSettings: vi.fn(),
  hidePet: vi.fn(),
  openHome: vi.fn(),
  listenMascotChanged: vi.fn(),
  clearPetWebviewChrome: vi.fn(),
  setPetWebviewPosition: vi.fn(),
  startPetWebviewDrag: vi.fn(),
  getPetDesktop: vi.fn(),
  onPetWebviewScaleChanged: vi.fn(),
  setPetWebviewLogicalSize: vi.fn(),
  petSupportsManualMotion: vi.fn(),
  onPetWebviewMoved: vi.fn(),
  onPetWebviewFocusChanged: vi.fn(),
  getPetWebviewWindow: vi.fn(),
  showPetContextMenu: vi.fn(),
}));

vi.mock("../lib/tauriApi", () => ({
  tauriApi: {
    loadConfig: mocks.loadConfig,
    patchConfig: mocks.patchConfig,
    showChatNearPet: mocks.showChatNearPet,
    showSettings: mocks.showSettings,
    hidePet: mocks.hidePet,
    openHome: mocks.openHome,
    listenMascotChanged: mocks.listenMascotChanged,
  },
}));

vi.mock("../lib/tauriWebviewApi", () => ({
  clearPetWebviewChrome: mocks.clearPetWebviewChrome,
  setPetWebviewPosition: mocks.setPetWebviewPosition,
  startPetWebviewDrag: mocks.startPetWebviewDrag,
  getPetDesktop: mocks.getPetDesktop,
  onPetWebviewScaleChanged: mocks.onPetWebviewScaleChanged,
  setPetWebviewLogicalSize: mocks.setPetWebviewLogicalSize,
  petSupportsManualMotion: mocks.petSupportsManualMotion,
  onPetWebviewMoved: mocks.onPetWebviewMoved,
  onPetWebviewFocusChanged: mocks.onPetWebviewFocusChanged,
  getPetWebviewWindow: mocks.getPetWebviewWindow,
}));

vi.mock("../lib/petContextMenu", () => ({
  showPetContextMenu: mocks.showPetContextMenu,
}));

describe("PetWindow", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadConfig.mockResolvedValue({
      ...DEFAULT_APP_CONFIG,
      mascotId: "type",
      petX: 120,
      petY: 240,
    });
    mocks.patchConfig.mockResolvedValue(undefined);
    mocks.showChatNearPet.mockResolvedValue(undefined);
    mocks.showSettings.mockResolvedValue(undefined);
    mocks.hidePet.mockResolvedValue(undefined);
    mocks.openHome.mockResolvedValue(undefined);
    mocks.listenMascotChanged.mockResolvedValue(vi.fn());
    mocks.clearPetWebviewChrome.mockResolvedValue(undefined);
    mocks.setPetWebviewPosition.mockResolvedValue(undefined);
    mocks.startPetWebviewDrag.mockResolvedValue(undefined);
    mocks.getPetDesktop.mockResolvedValue({
      position: { x: 0, y: 0 },
      scaleFactor: 1,
      monitors: [
        {
          scaleFactor: 1,
          workArea: {
            position: { x: 0, y: 0 },
            size: { width: 1920, height: 1040 },
          },
        },
      ],
    });
    mocks.onPetWebviewScaleChanged.mockResolvedValue(vi.fn());
    mocks.setPetWebviewLogicalSize.mockResolvedValue(undefined);
    mocks.petSupportsManualMotion.mockReturnValue(false);
    mocks.showPetContextMenu.mockResolvedValue(undefined);
    mocks.getPetWebviewWindow.mockReturnValue({});
    mocks.onPetWebviewMoved.mockImplementation(async (handler) => {
      await Promise.resolve();
      handler({ x: 130, y: 250 });
      return vi.fn();
    });
    mocks.onPetWebviewFocusChanged.mockResolvedValue(vi.fn());
  });

  it("loads mascot from config on mount", async () => {
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalledOnce());
    expect(mocks.setPetWebviewLogicalSize).toHaveBeenCalledWith(160);
    expect(mocks.setPetWebviewPosition).toHaveBeenCalledWith(120, 240);
  });

  it("opens chat on click without drag", async () => {
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalled());

    mocks.clearPetWebviewChrome.mockClear();
    fireEvent.click(screen.getByTestId("pet-drag-region"));

    await waitFor(() => expect(mocks.showChatNearPet).toHaveBeenCalledOnce());
    expect(mocks.clearPetWebviewChrome).not.toHaveBeenCalled();
  });

  it("blocks text selection on the pet surface", () => {
    render(<PetWindow />);

    const event = new Event("selectstart", { bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("starts drag after pointer moves beyond threshold", async () => {
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalled());

    const region = screen.getByTestId("pet-drag-region");
    fireEvent.pointerDown(region, { clientX: 0, clientY: 0, button: 0 });
    fireEvent.pointerMove(region, { clientX: 20, clientY: 0, button: 0 });

    await waitFor(() =>
      expect(mocks.startPetWebviewDrag).toHaveBeenCalledOnce(),
    );
    expect(mocks.setPetWebviewPosition).toHaveBeenCalledTimes(1);
  });

  it("moves the window with setPosition on Windows instead of OS drag", async () => {
    mocks.petSupportsManualMotion.mockReturnValue(true);
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalled());

    const region = screen.getByTestId("pet-drag-region");
    fireEvent.pointerDown(region, {
      clientX: 10,
      clientY: 12,
      screenX: 100,
      screenY: 200,
      button: 0,
    });
    fireEvent.pointerMove(region, {
      clientX: 30,
      clientY: 12,
      screenX: 120,
      screenY: 200,
      button: 0,
    });

    await waitFor(() =>
      expect(mocks.setPetWebviewPosition).toHaveBeenCalledWith(150, 250),
    );
    expect(mocks.startPetWebviewDrag).not.toHaveBeenCalled();
  });

  it("keeps physical inertia at 125% after a manual drag is released", async () => {
    const desktop = await mocks.getPetDesktop();
    mocks.getPetDesktop.mockResolvedValue({ ...desktop, scaleFactor: 1.25 });
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    mocks.petSupportsManualMotion.mockReturnValue(true);
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalled());

    const now = vi.spyOn(performance, "now").mockReturnValue(0);
    const region = screen.getByTestId("pet-drag-region");
    fireEvent.pointerDown(region, {
      clientX: 10,
      clientY: 12,
      screenX: 100,
      screenY: 200,
      pointerId: 1,
      button: 0,
    });
    now.mockReturnValue(50);
    fireEvent.pointerMove(region, {
      clientX: 30,
      clientY: 12,
      screenX: 120,
      screenY: 200,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerUp(region, { pointerId: 1 });

    expect(frames).toHaveLength(1);
    act(() => frames.shift()?.(66));
    const lastCall = mocks.setPetWebviewPosition.mock.calls.at(-1);
    expect(lastCall?.[0]).toBeCloseTo(
      155 + 0.5 * Math.pow(0.88, 16 / (1000 / 60)) * 16,
    );
    expect(lastCall?.[1]).toBe(250);
  });

  it("uses physical deltas at 125% and keeps moved coordinates unscaled across drags", async () => {
    let moved: (position: { x: number; y: number }) => void = () => {};
    mocks.onPetWebviewMoved.mockImplementation(async (handler) => {
      moved = handler;
      return vi.fn();
    });
    const desktop = await mocks.getPetDesktop();
    mocks.getPetDesktop.mockResolvedValue({ ...desktop, scaleFactor: 1.25 });
    mocks.petSupportsManualMotion.mockReturnValue(true);
    render(<PetWindow />);
    await waitFor(() => expect(mocks.onPetWebviewMoved).toHaveBeenCalled());
    const region = screen.getByTestId("pet-drag-region");
    fireEvent.pointerDown(region, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(region, { clientX: 30, clientY: 18 });
    expect(mocks.setPetWebviewPosition).toHaveBeenLastCalledWith(145, 250);
    // A second pointer event before the native move must not add the delta twice.
    fireEvent.pointerMove(region, { clientX: 30, clientY: 18 });
    expect(mocks.setPetWebviewPosition).toHaveBeenLastCalledWith(145, 250);
    act(() => moved({ x: 145, y: 250 }));
    // Cancel the first gesture without scheduling inertia.
    fireEvent.click(region);
    fireEvent.pointerDown(region, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(region, { clientX: 30, clientY: 18 });
    expect(mocks.setPetWebviewPosition).toHaveBeenLastCalledWith(170, 260);
    act(() => moved({ x: 170, y: 260 }));
    await waitFor(() =>
      expect(mocks.patchConfig).toHaveBeenCalledWith({ petX: 170, petY: 260 }),
    );
  });

  it("recovers a saved position after the external display is removed", async () => {
    mocks.loadConfig.mockResolvedValue({
      ...DEFAULT_APP_CONFIG,
      petX: -1800,
      petY: 200,
    });
    mocks.onPetWebviewMoved.mockResolvedValue(vi.fn());
    render(<PetWindow />);
    await waitFor(() =>
      expect(mocks.setPetWebviewPosition).toHaveBeenCalledWith(0, 200),
    );
    expect(mocks.patchConfig).toHaveBeenCalledWith({ petX: 0, petY: 200 });
  });

  it("keeps the entire restored pet visible at the bottom-right edge at 125%", async () => {
    const desktop = await mocks.getPetDesktop();
    mocks.getPetDesktop.mockResolvedValue({
      ...desktop,
      scaleFactor: 1.25,
      monitors: [
        {
          scaleFactor: 1.25,
          workArea: {
            position: { x: 0, y: 40 },
            size: { width: 1920, height: 1040 },
          },
        },
      ],
    });
    mocks.loadConfig.mockResolvedValue({
      ...DEFAULT_APP_CONFIG,
      petX: 1900,
      petY: 1050,
    });
    mocks.onPetWebviewMoved.mockResolvedValue(vi.fn());
    render(<PetWindow />);
    await waitFor(() =>
      expect(mocks.setPetWebviewPosition).toHaveBeenCalledWith(1720, 880),
    );
    expect(mocks.patchConfig).toHaveBeenCalledWith({ petX: 1720, petY: 880 });
  });

  it("clamps a manual drag before positioning the pet at 125%", async () => {
    const desktop = await mocks.getPetDesktop();
    mocks.getPetDesktop.mockResolvedValue({
      ...desktop,
      scaleFactor: 1.25,
      monitors: [
        {
          scaleFactor: 1.25,
          workArea: {
            position: { x: 0, y: 40 },
            size: { width: 1920, height: 1040 },
          },
        },
      ],
    });
    mocks.petSupportsManualMotion.mockReturnValue(true);
    render(<PetWindow />);
    await waitFor(() => expect(mocks.onPetWebviewMoved).toHaveBeenCalled());
    const region = screen.getByTestId("pet-drag-region");
    fireEvent.pointerDown(region, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(region, { clientX: 2010, clientY: 2010 });
    expect(mocks.setPetWebviewPosition).toHaveBeenLastCalledWith(1720, 880);
  });

  it("preserves a saved physical position on an attached mixed-DPI secondary monitor", async () => {
    const desktop = await mocks.getPetDesktop();
    mocks.getPetDesktop.mockResolvedValue({
      ...desktop,
      monitors: [
        ...desktop.monitors,
        {
          scaleFactor: 1.5,
          workArea: {
            position: { x: -2560, y: -200 },
            size: { width: 2560, height: 1440 },
          },
        },
      ],
    });
    mocks.loadConfig.mockResolvedValue({
      ...DEFAULT_APP_CONFIG,
      petX: -1800,
      petY: 200,
    });
    mocks.onPetWebviewMoved.mockResolvedValue(vi.fn());
    render(<PetWindow />);
    await waitFor(() =>
      expect(mocks.setPetWebviewPosition).toHaveBeenCalledWith(-1800, 200),
    );
    expect(mocks.patchConfig).not.toHaveBeenCalled();
  });

  it("resizes from the bottom-right hover handle and persists the size", async () => {
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalled());

    const handle = screen.getByRole("button", { name: "调整宠物大小" });
    fireEvent.pointerDown(handle, {
      screenX: 100,
      screenY: 100,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerMove(handle, {
      screenX: 140,
      screenY: 130,
      pointerId: 1,
    });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    await waitFor(() =>
      expect(mocks.setPetWebviewLogicalSize).toHaveBeenCalledWith(200),
    );
    expect(mocks.patchConfig).toHaveBeenCalledWith({ petSize: 200 });
    expect(mocks.showChatNearPet).not.toHaveBeenCalled();
  });

  it("does not open chat after a drag click", async () => {
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalled());

    const region = screen.getByTestId("pet-drag-region");
    fireEvent.pointerDown(region, { clientX: 0, clientY: 0, button: 0 });
    fireEvent.pointerMove(region, { clientX: 20, clientY: 0, button: 0 });
    fireEvent.click(region);

    expect(mocks.showChatNearPet).not.toHaveBeenCalled();
  });

  it("debounces rapid chat opens", async () => {
    vi.useFakeTimers();
    render(<PetWindow />);
    await act(async () => {
      await Promise.resolve();
    });

    const region = screen.getByTestId("pet-drag-region");
    fireEvent.click(region);
    fireEvent.click(region);

    expect(mocks.showChatNearPet).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("persists position when webview moves", async () => {
    render(<PetWindow />);
    await waitFor(() =>
      expect(mocks.patchConfig).toHaveBeenCalledWith({
        petX: 130,
        petY: 250,
      }),
    );
  });

  it("shows native context menu on right click", async () => {
    render(<PetWindow />);
    await waitFor(() => expect(mocks.loadConfig).toHaveBeenCalled());

    fireEvent.contextMenu(screen.getByTestId("pet-drag-region"));

    await waitFor(() =>
      expect(mocks.showPetContextMenu).toHaveBeenCalledOnce(),
    );
  });

  it("syncs mascot from mascot-changed event", async () => {
    let mascotHandler: ((id: "peek" | "type") => void) | undefined;
    mocks.listenMascotChanged.mockImplementation(async (handler) => {
      mascotHandler = handler;
      return vi.fn();
    });

    render(<PetWindow />);
    await waitFor(() => expect(mascotHandler).toBeDefined());

    act(() => mascotHandler?.("peek"));

    await waitFor(() =>
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "/mascots/peek.webp",
      ),
    );
  });

  it("clears transparent chrome on focus changes", async () => {
    let focusHandler: (() => void) | undefined;
    mocks.onPetWebviewFocusChanged.mockImplementation(async (handler) => {
      focusHandler = handler;
      return vi.fn();
    });

    render(<PetWindow />);
    await waitFor(() => expect(focusHandler).toBeDefined());

    mocks.clearPetWebviewChrome.mockClear();
    act(() => focusHandler?.());

    await waitFor(() => expect(mocks.clearPetWebviewChrome).toHaveBeenCalled());
  });
});
