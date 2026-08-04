import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getAuthUser } from "@/lib/auth";

export async function GET() {

  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }


  const count = await prisma.notification.count({
    where:{
      userId:user.userId,
      isRead:false
    }
  });


  return NextResponse.json({
    count
  });
}