import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function usePdfFullscreen() {
  const readerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === readerRef.current);

    document.addEventListener("fullscreenchange", syncFullscreen);

    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  async function toggleFullscreen() {
    const reader = readerRef.current;

    if (!isFullscreen && !reader?.requestFullscreen) {
      toast.error("Fullscreen is unavailable in this browser.");

      return false;
    }

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await reader!.requestFullscreen();
      }

      return true;
    } catch {
      toast.error("Could not change fullscreen mode.");

      return false;
    }
  }

  return { readerRef, isFullscreen, toggleFullscreen };
}
