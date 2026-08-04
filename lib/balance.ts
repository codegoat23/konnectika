import { prisma } from "./prisma";

export async function getBrandBalance(userId: string) {
  return prisma.earning.findMany({
    where: {
      submission: {
        campaign: {
          businessProfile: {
            userId,
          },
        },
      },
    },

    include: {
      creator: true,
      submission: {
        include: {
          campaign: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}
