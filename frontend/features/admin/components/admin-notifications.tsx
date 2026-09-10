import { useCallback } from "react";
import { Bell, Check, CheckCheck, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useAdminNotifications } from "../hooks/use-admin-notifications";
import type { AdminNotification } from "@shared/contracts";

interface AdminNotificationsProps {
  enabled: boolean;
  onOpenOrder: (orderId: number) => void;
}

function formatNotificationDate(value: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminNotifications({ enabled, onOpenOrder }: AdminNotificationsProps) {
  const handleOpenOrder = useCallback((orderId: number) => onOpenOrder(orderId), [onOpenOrder]);
  const { notifications, unreadCount, isLoading, markRead, markAllRead, isMarkingAllRead } = useAdminNotifications(enabled, handleOpenOrder);

  const openNotification = (notification: AdminNotification) => {
    if (!notification.readAt) markRead(notification.id);
    onOpenOrder(notification.orderId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount ? `${unreadCount} notificações não lidas` : "Notificações"} data-testid="button-admin-notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-black" data-testid="badge-admin-notifications">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="font-semibold">Notificações</p>
            <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} não lida${unreadCount === 1 ? "" : "s"}` : "Tudo em dia"}</p>
          </div>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={() => markAllRead()} disabled={isMarkingAllRead} data-testid="button-mark-all-notifications-read"><CheckCheck className="mr-1 h-4 w-4" /> Marcar todas</Button>}
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-7 w-7" /><p>Nenhuma notificação.</p></div>
          ) : notifications.map((notification) => (
            <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors hover:bg-muted/60 ${notification.readAt ? "" : "bg-primary/5"}`} data-testid={`admin-notification-${notification.id}`}>
              <span className={`mt-0.5 rounded-full p-1.5 ${notification.readAt ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}><ShoppingBag className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium"><span className="truncate">{notification.title}</span>{!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{notification.message}</span>
                <span className="mt-1 block text-[10px] text-muted-foreground">{formatNotificationDate(notification.createdAt)}</span>
              </span>
              {notification.readAt && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
