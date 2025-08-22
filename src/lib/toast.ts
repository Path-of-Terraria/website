import { writable } from 'svelte/store';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

const createToastStore = () => {
  const { subscribe, update } = writable<ToastItem[]>([]);
  let nextId = 1;

  function remove(id: number) {
    update((items) => items.filter((t) => t.id !== id));
  }

  function push(message: string, opts?: Partial<Pick<ToastItem, 'type' | 'duration'>>) {
    const item: ToastItem = {
      id: nextId++,
      message,
      type: opts?.type ?? 'success',
      duration: opts?.duration ?? 5000,
    };
    update((items) => [item, ...items]);

    // auto-dismiss
    if (item.duration > 0) {
      setTimeout(() => remove(item.id), item.duration);
    }
  }

  return { subscribe, push, remove };
};

export const toasts = createToastStore();
export const toast = {
  push: (message: string, opts?: Partial<Pick<ToastItem, 'type' | 'duration'>>) => toasts.push(message, opts),
};
