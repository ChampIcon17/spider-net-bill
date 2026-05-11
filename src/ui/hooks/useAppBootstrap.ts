import * as React from "react";
import { hydrateAppState, watchStorage } from "@/controllers/appController";

export function useAppBootstrap(): void {
  React.useEffect(() => {
    hydrateAppState();
    const stop = watchStorage();
    return () => stop();
  }, []);
}

