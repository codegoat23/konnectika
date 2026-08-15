"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import NotificationDrawer from "./NotificationDrawer";
import { useUnreadCount } from "@/hooks/useNotifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className="relative cursor-pointer p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={22} className="size-4 scale-100 transition-transform" />

        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <NotificationDrawer open={open} setOpen={setOpen} />
    </>
  );
}
