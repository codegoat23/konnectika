import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, signToken } from "@/lib/auth";

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
     // ✅ Fresh JWT for middleware
       const newToken = await signToken({
         userId: user.userId,
         role: user.role,
         onboardingStep: 5,
         onboardingDone: true,
         type: "access",
       });
   
       const response = NextResponse.json({
         success: true,
         redirectTo: "/dashboard",
       });
   
       response.cookies.set("token", newToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         path: "/",
         maxAge: 60 * 60 * 24 * 7,
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