import { writable } from "svelte/store";

type LoadingState = {
  active: boolean;
  progress: number;
};

const activeLoaders = new Set<string>();
const loaderProgress = new Map<string, number>();

let bootstrap = true;
let state: LoadingState = { active: true, progress: 0 };
const { subscribe, set } = writable<LoadingState>(state);

const update = () => {
  const active = bootstrap || activeLoaders.size > 0;
  let progress = 0;

  if (loaderProgress.size > 0) {
    let sum = 0;
    loaderProgress.forEach((value) => {
      sum += value;
    });
    progress = sum / loaderProgress.size;
  }

  state = {
    active,
    progress: active ? progress : 0
  };

  set(state);
};

export const loadingState = { subscribe };

export const resolveBootstrap = () => {
  if (!bootstrap) return;
  bootstrap = false;
  update();
};

export const beginLoading = (id: string) => {
  if (!id) return;
  if (bootstrap) {
    bootstrap = false;
  }
  activeLoaders.add(id);
  loaderProgress.set(id, 0);
  update();
};

export const setLoadingProgress = (id: string, value: number) => {
  if (!id || !loaderProgress.has(id)) return;
  const clamped = Math.min(Math.max(value, 0), 1);
  loaderProgress.set(id, clamped);
  update();
};

export const endLoading = (id: string) => {
  if (!id) return;
  activeLoaders.delete(id);
  loaderProgress.delete(id);
  update();
};

export const resetLoading = () => {
  activeLoaders.clear();
  loaderProgress.clear();
  update();
};
