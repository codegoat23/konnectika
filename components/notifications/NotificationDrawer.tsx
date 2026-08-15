"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BellOff, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { CgClose } from "react-icons/cg";
import type { Notification } from "@prisma/client";

import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/hooks/useNotifications";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "../ui/button";

const notificationTypeStyles = {
  INFO: "border-l-orange-500",
  SUCCESS: "border-l-success",
  WARNING: "border-l-warning",
  ERROR: "border-l-destructive",
} as const;

export default function NotificationDrawer({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingIds((prev) => new Set(prev).add(id));
    deleteNotification.mutate(id, {
      onSuccess: () => toast.success("Notification deleted"),
      onSettled: () => {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
    });
  };

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: () => toast.success("All notifications deleted"),
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="top-6 bottom-6 right-6 h-auto w-[400px] rounded-2xl border border-border overflow-hidden">
        <DrawerHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
          <DrawerTitle>Notifications</DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            <CgClose />
          </Button>
        </DrawerHeader>

        {notifications.length > 0 && (
          <div className="flex flex-row items-center justify-between gap-2 px-4 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                  className="text-orange-500 hover:text-orange-600 cursor-pointer"
                >
                  {markAllRead.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="size-3.5" />
                  )}
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDeleteAll}
                disabled={deleteAll.isPending}
                title="Delete all notifications"
                className="text-muted-foreground hover:text-destructive cursor-pointer"
              >
                {deleteAll.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <BellOff className="size-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              role="button"
              tabIndex={0}
              onClick={() => handleClick(notification)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(notification);
                }
              }}
              className={`group flex flex-col gap-3 rounded-[14px] border p-4 cursor-pointer transition-all duration-200 ${notificationTypeStyles[notification.type]} ${
                !notification.isRead
                  ? `bg-orange-50 border-orange-200 dark:bg-orange-100/[0.08] dark:border-orange-300/25`
                  : `bg-card border-border dark:bg-card dark:border-border`
              } hover:border-orange-300 hover:bg-orange-50/60 hover:shadow-sm dark:hover:border-orange-500/40 dark:hover:bg-orange-500/[0.06] dark:hover:shadow-none hover:scale-[1.005]`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground">
                  {notification.title}
                </h3>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Delete notification"
                  onClick={(e) => handleDelete(e, notification.id)}
                  disabled={deletingIds.has(notification.id)}
                  className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer"
                >
                  {deletingIds.has(notification.id) ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {notification.message}
              </p>

              <p className="mt-1 text-xs text-muted-foreground/80">
                {new Date(notification.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
