import { useEffect, useState } from "react";

export function useBookUrl(file: File) {
  const [source, setSource] = useState<{ file: File; url: string }>();
  useEffect(() => {
    const url = URL.createObjectURL(file);
    // oxlint-disable-next-line react/set-state-in-effect -- Publish a browser resource created and released by this effect.
    setSource({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return source?.file === file ? source.url : undefined;
}
