import type { AdminNotification } from "@shared/schema";

type AdminNotificationListener = (notification: AdminNotification) => void;

const listeners = new Set<AdminNotificationListener>();

export function subscribeAdminNotifications(listener: AdminNotificationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishAdminNotification(notification: AdminNotification): void {
  listeners.forEach((listener) => {
    try {
      listener(notification);
    } catch (error) {
      console.error("Admin notification listener failed", error);
    }
  });
}
