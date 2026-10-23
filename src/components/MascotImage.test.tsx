// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import MascotImage from "./MascotImage";

afterEach(cleanup);

describe("built-in mascot assets", () => {
  it.each(["peek", "type"])("renders the %s animation directly", (name) => {
    const src = `/mascots/${name}.webp`;
    const { container } = render(<MascotImage src={src} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", src);
    expect(container.querySelector("svg")).toBeNull();
  });
});
