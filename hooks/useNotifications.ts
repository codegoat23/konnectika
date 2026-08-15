"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Notification } from "@prisma/client";

const notificationsQueryKey = ["notifications"] as const;
const unreadCountQueryKey = ["notifications", "unread"] as const;

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");

  if (!res.ok) {
    throw new Error("Failed to load notifications");
  }

  return res.json();
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/notifications/unread");

  if (!res.ok) {
    throw new Error("Failed to load unread count");
  }

  const data = await res.json();
  return data.count as number;
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });
}

// Optimistically update both queries so the bell badge and drawer list react
// instantly, then re-sync with the server in the background.
function updateNotificationCache(
  queryClient: ReturnType<typeof useQueryClient>,
  update: (notifications: Notification[]) => Notification[],
  unreadDelta: number
) {
  queryClient.setQueryData<Notification[]>(notificationsQueryKey, (old) =>
    old ? update(old) : old
  );
  queryClient.setQueryData<number>(unreadCountQueryKey, (old) => {
    if (typeof old !== "number") return old;
    return Math.max(0, old + unreadDelta);
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: notificationsQueryKey,
      });
      const previous = queryClient.getQueryData<Notification[]>(
        notificationsQueryKey
      );
      updateNotificationCache(
        queryClient,
        (notifications) =>
          notifications.map((n) =>
            n.id === id && !n.isRead ? { ...n, isRead: true } : n
          ),
        -1
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark notifications as read");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationsQueryKey,
      });
      const previous = queryClient.getQueryData<Notification[]>(
        notificationsQueryKey
      );
      updateNotificationCache(
        queryClient,
        (notifications) =>
          notifications.map((n) => ({ ...n, isRead: true })),
        0
      );
      queryClient.setQueryData<number>(unreadCountQueryKey, 0);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete notification");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: notificationsQueryKey,
      });
      const previous = queryClient.getQueryData<Notification[]>(
        notificationsQueryKey
      );
      const removed = previous?.find((n) => n.id === id);
      updateNotificationCache(
        queryClient,
        (notifications) => notifications.filter((n) => n.id !== id),
        removed && !removed.isRead ? -1 : 0
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete notifications");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationsQueryKey,
      });
      const previous = queryClient.getQueryData<Notification[]>(
        notificationsQueryKey
      );
      queryClient.setQueryData<Notification[]>(notificationsQueryKey, []);
      queryClient.setQueryData<number>(unreadCountQueryKey, 0);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}
