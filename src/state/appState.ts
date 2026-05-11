import type { SpiderBundle, SpiderDevice, SpiderTransaction, SpiderUser } from "@/domain/models";
import { createStore } from "@/state/store";

export type AppState = {
  user: SpiderUser | null;
  bundle: SpiderBundle | null;
  transactions: SpiderTransaction[];
  devices: SpiderDevice[];
};

export const appStore = createStore<AppState>({
  user: null,
  bundle: null,
  transactions: [],
  devices: [],
});

