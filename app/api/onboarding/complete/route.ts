import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(){
    try {
         const user = await getAuthUser()

    if(!user){
        return NextResponse.json({
            error: "Unauthorized"
        },
    {status: 401})
    }

    await prisma.user.update({
        where: {
            id: user.userId
        },
        data: {
        onboardingStep: 5,
        onboardingDone: true,
      },
    },
     
)
   
       const response = NextResponse.json({
         success: true,
         redirectTo: "/dashboard",
       });
   
   
       return response;
     } catch (err) {
       console.error("OTP ERROR:", err);
   
       return NextResponse.json(
         { error: "Server error" },
         { status: 500 }
       );
     }
}