import { useEffect, useState } from "react";

export function useUrlPanelState(paramName: string) {
  const readValue = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(paramName));
  const [value, setValue] = useState<string | null>(readValue);

  useEffect(() => {
    const handlePopState = () => setValue(readValue());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [paramName]);

  function updateValue(nextValue: string | null) {
    const url = new URL(window.location.href);
    if (nextValue) {
      url.searchParams.set(paramName, nextValue);
    } else {
      url.searchParams.delete(paramName);
    }
    window.history.pushState(null, "", url);
    setValue(nextValue);
  }

  return [value, updateValue] as const;
}
