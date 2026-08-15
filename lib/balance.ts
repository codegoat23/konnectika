import { prisma } from "./prisma";

export async function getBrandBalance(userId: string) {
  return prisma.earning.findMany({
    where: {
      campaign: {
        businessProfile: {
          userId,
        },
      },
    },

    include: {
      creator: true,
      campaign: true,
      submission: true,
      payout: {
        select: { id: true, status: true, paymentReference: true, paidAt: true },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}
