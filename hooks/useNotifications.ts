"use client";

import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@prisma/client";


async function fetchNotifications(): Promise<Notification[]> {

 const res = await fetch(
   "/api/notifications"
 );

 if(!res.ok){
   throw new Error("Failed");
 }

 return res.json();

}


export function useNotifications(){

 return useQuery({
   queryKey:["notifications"],
   queryFn:fetchNotifications,
   refetchInterval:30000,
 });

}