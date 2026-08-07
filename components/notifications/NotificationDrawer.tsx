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
    className="text-orange-500"
    >Mark all Read</Button>
</div>

)}


         {notifications.map((notification) => (
           
  <div
    key={notification.id}
    className={`
      rounded-[14px]
      cursor-pointer
      flex
      flex-col
    bg-card
      border border-border
     transition-all duration-200
   hover:border-orange-500/40
   hover:bg-muted
    hover:scale-[1.01]
      border-l-1
      ${notificationTypeStyles[notification.type as keyof typeof notificationTypeStyles] || ""}
      p-4
      gap-3
      
      ${
        !notification.isRead
          ? "bg-orange-500/10"
          : ""
      }
    `}
  >
    <h3 className="font-semibold">
      {notification.title}
    </h3>

    <p className="text-xs text-muted-foreground">
      {notification.message}
    </p>

    <p className="text-xs mt-2 text-muted-foreground">
      {new Date(notification.createdAt).toLocaleDateString()}
    </p>
  </div>
))}

        </div>


      </DrawerContent>

    </Drawer>
  );
}