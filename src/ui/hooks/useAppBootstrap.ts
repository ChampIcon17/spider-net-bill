import * as React from "react";
import { bootstrapApp } from "@/controllers/appController";

export function useAppBootstrap(): void {
  React.useEffect(() => {
    bootstrapApp();
  }, []);
}
