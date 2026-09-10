import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/use-toast";
import { ToastAction } from "@/shared/ui/toast";
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/shared/lib/api";
import { apiUrl } from "@/shared/lib/api-config";
import type { AdminNotification } from "@shared/contracts";

export function useAdminNotifications(enabled: boolean, onOpenOrder: (orderId: number) => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const seenEventIds = useRef(new Set<number>());
  const onOpenOrderRef = useRef(onOpenOrder);
  const query = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: fetchAdminNotifications,
    enabled,
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const markReadMutation = useMutation({
    mutationFn: markAdminNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminNotifications"] }),
  });
  const markAllMutation = useMutation({
    mutationFn: markAllAdminNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminNotifications"] }),
  });
  onOpenOrderRef.current = onOpenOrder;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof EventSource === "undefined") return;
    const source = new EventSource(apiUrl("/admin/notifications/stream"), { withCredentials: true });
    const handleNotification = (event: MessageEvent<string>) => {
      try {
        const notification = JSON.parse(event.data) as AdminNotification;
        if (!notification.id || seenEventIds.current.has(notification.id)) return;
        seenEventIds.current.add(notification.id);
        queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
        queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
        toast({
          title: notification.title,
          description: notification.message,
          action: <ToastAction altText="Abrir pedido" onClick={() => { markReadMutation.mutate(notification.id); onOpenOrderRef.current(notification.orderId); }}>Ver pedido</ToastAction>,
        });
      } catch {
        // Eventos inválidos não devem interromper a conexão SSE.
      }
    };
    source.addEventListener("notification", handleNotification as EventListener);
    return () => {
      source.removeEventListener("notification", handleNotification as EventListener);
      source.close();
    };
  }, [enabled, queryClient, toast]);

  return {
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unreadCount || 0,
    isLoading: query.isLoading,
    markRead: (id: number) => markReadMutation.mutate(id),
    markAllRead: () => markAllMutation.mutate(),
    isMarkingAllRead: markAllMutation.isPending,
  };
}
