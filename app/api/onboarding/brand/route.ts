import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, signToken } from "@/lib/auth";


export async function POST(
 req:Request
){

 try {

  const user = await getAuthUser();


  if(!user){
    return NextResponse.json(
      {
        error:"Unauthorized"
      },
      {
        status:401
      }
    )
  }



  const body = await req.json();



  const profile =
    await prisma.businessProfile.upsert({

      where:{
        userId:user.userId
      },

      update:{
        
        website:body.website,
        industry:body.industry,
        description:body.description
      },

      create:{
        userId:user.userId,
        website:body.website,
        industry:body.industry,
        description:body.description
      }

    });



  await prisma.user.update({

    where:{
      id:user.userId
    },

    data:{
      onboardingDone:false,
      onboardingStep:4
    }

  });



   // ✅ Re-issue JWT with updated onboardingStep
     const newToken = await signToken({
       userId: user.userId,
       role: user.role,
       onboardingDone: false,
       onboardingStep: 4,
       type: "access",
     });
 
     const res = NextResponse.json({
       success: true,
       nextStep: "/onboarding/welcome",
     });
 
     // ✅ Overwrite the stale cookie
     res.cookies.set("token", newToken, {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite: "lax",
       maxAge: 60 * 60 * 24 * 7,
       path: "/",
     });
 
     return res;



 } catch(error){

  console.log(error);

  return NextResponse.json(
    {
      error:"Something went wrong"
    },
    {
      status:500
    }
  )

 }

}