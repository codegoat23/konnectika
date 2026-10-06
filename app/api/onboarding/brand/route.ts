import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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

  if (user.role !== "BRAND") {
    return NextResponse.json({ error: "Only brands can update a brand profile" }, { status: 403 });
  }

  const body = await req.json();

  const profile =
    await prisma.businessProfile.upsert({

      where:{
        userId:user.userId
      },

      update:{
        logo: typeof body.logo === "string" ? body.logo.trim() || null : undefined,
        website:body.website,
        industry:body.industry,
        description:body.description
      },

      create:{
        userId:user.userId,
        logo: typeof body.logo === "string" ? body.logo.trim() || null : null,
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

 
     const res = NextResponse.json({
       success: true,
       nextStep: "/onboarding/welcome",
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
