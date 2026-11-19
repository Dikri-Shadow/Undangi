export type AdminToastKind = "success" | "info" | "warning" | "error";
export type AdminToastState = { id: number; kind: AdminToastKind; message: string } | null;

export const toastDurations: Record<AdminToastKind, number> = {
  success: 2500,
  info: 3000,
  warning: 4000,
  error: 5000,
};

export function nextToast(previous: AdminToastState, kind: AdminToastKind, message: string, now = Date.now()): AdminToastState {
  if (previous?.message === message && previous.kind === kind) return { ...previous, id: now };
  return { id: now, kind, message };
}
