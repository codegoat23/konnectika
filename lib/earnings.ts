import { prisma } from "@/lib/prisma";

export async function getCreatorEarnings(creatorId: string) {
  const items = await prisma.earning.findMany({
    where: {
      creatorId,
    },
    select: {
      creatorAmount: true,
      status: true,
      createdAt: true,
    },
  });

  const totalEarnings = items.reduce(
    (sum, item) => sum + item.creatorAmount,
    0
  );

  const pendingEarnings = items
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + item.creatorAmount, 0);

  return {
    totalEarnings,
    pendingEarnings,
    items,
  };
}

export type CreatorEarnings = Awaited<ReturnType<typeof getCreatorEarnings>>;
