import { prisma } from "@/lib/prisma";

export async function getCreatorEarnings(creatorId: string) {
  const earnings = await prisma.earning.findMany({
    where: {
      creatorId,
    },
    select: {
      creatorAmount: true,
      status: true,
    },
  });

  const totalEarnings = earnings.reduce(
    (sum, item) => sum + item.creatorAmount,
    0
  );

  const pendingEarnings = earnings
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + item.creatorAmount, 0);

  return {
    totalEarnings,
    pendingEarnings,
  };
}
