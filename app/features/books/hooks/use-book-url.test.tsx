import { renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useBookUrl } from "./use-book-url";

afterEach(() => vi.unstubAllGlobals());

it("releases object URLs when the selected file changes or the viewer closes", () => {
  const createObjectURL = vi
    .fn()
    .mockReturnValueOnce("blob:first")
    .mockReturnValueOnce("blob:second");
  const revokeObjectURL = vi.fn();

  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  const first = new File(["first"], "first.pdf");
  const second = new File(["second"], "second.pdf");
  const { result, rerender, unmount } = renderHook(({ file }) => useBookUrl(file), {
    initialProps: { file: first },
  });

  expect(result.current).toBe("blob:first");
  rerender({ file: second });
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
  expect(result.current).toBe("blob:second");
  unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:second");
});
