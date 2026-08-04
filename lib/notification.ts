import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// lib/notifications.ts

export async function notify({
  userId,
  title,
  message,
  type,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  });
}

export async function Notifycreators({
  title,
  message,
  type,
}: {
 
  title: string;
  message: string;
  type: NotificationType;
}
){

const creators = await prisma.user.findMany({
  where: {
    role: "CREATOR",
  },
  select: {
    id: true,
  },
});


await prisma.notification.createMany({
  data: creators.map((creator) => ({
    userId: creator.id,
    title,
    message,
    type,
  })),
});

}

export async function NotifyAdmin({
  title,
  message,
  type,
}: {
  title: string;
  message: string;
  type: NotificationType;
}
){

const admins = await prisma.user.findMany({
  where: {
    role: "ADMIN",
  },
  select: {
    id: true,
  },
});


await prisma.notification.createMany({
  data: admins.map((admin) => ({
    userId: admin.id,
    title,
    message,
    type,
  })),
});

}