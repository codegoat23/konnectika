import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const user = await getAuthUser();
    if(!user){
        return NextResponse.json(
            { message: "Unauthorized"},
            {status: 401}
        )
    }
    const person = await prisma.user.findUnique({
        where: {
            id: user?.userId
        },include: {
            creatorProfile: true,
            businessProfile: true,
        }
    })
    
    const name = person?.creatorProfile?.username ?? person?.businessProfile?.companyName;
      
    
    const User = {
        name,
        email: person?.email,
        role: person?.role,
        avatar: "/thumbnails/vodacom.webp"
    }
    console.log(User)
    return NextResponse.json({ User });
}