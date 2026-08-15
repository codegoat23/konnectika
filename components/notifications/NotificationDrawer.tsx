"use client";

import { useNotifications } from "@/hooks/useNotifications";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { CgClose } from "react-icons/cg";
import { Button } from "../ui/button";


export default function NotificationDrawer({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {

  const {
    data: notifications = [],
  } = useNotifications();
 
 const notificationTypeStyles = {
  INFO: "border-l-orange-500",
  SUCCESS: "border-l-green-500",
  WARNING: "border-l-amber-500",
  ERROR: "border-l-red-500",
} as const;

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction="right"
    >

     <DrawerContent
  className="
    top-6
    bottom-6
    right-6
    h-auto
    w-[400px]
    rounded-2xl
    border
    border-border
    overflow-hidden
  "
>

        <DrawerHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
          <DrawerTitle>
            Notifications
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            <CgClose />
          </Button>
        </DrawerHeader>


        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {notifications.length === 0 && (
            <p className="text-muted-foreground">
              No notifications yet
            </p>
          )}
{notifications.length > 1 &&(
<div className="flex flex-row justify-between items-center">
   <span className="text-sm font-regular text-muted-foreground">recent notifications</span> 
   <Button
    className="text-orange-500 bg-transparent"
    >Mark all Read</Button>
</div>

)}


         {notifications.map((notification) => (
           
  <div
  key={notification.id}
  className={`
    group
    flex flex-col gap-3
    rounded-[14px]
    border
    p-4
    cursor-pointer
    transition-all duration-200

    ${
      !notification.isRead
        ? `
          bg-orange-50
          border-orange-200
          dark:bg-orange-100/[0.08]
          dark:border-orange-300/25
        `
        : `
          bg-card
          border-border
          dark:bg-card
          dark:border-border
        `
    }

    hover:border-orange-300
    hover:bg-orange-50/60
    hover:shadow-sm

    dark:hover:border-orange-500/40
    dark:hover:bg-orange-500/[0.06]
    dark:hover:shadow-none

    hover:scale-[1.005]
  `}
>
  <div className="flex items-center justify-between gap-3">
    <h3 className="font-semibold text-foreground">
      {notification.title}
    </h3>

    
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