import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";


export async function GET(req: Request) {

  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const creator = await prisma.creatorProfile.findUnique({
    where:{
      userId:user.userId
    }
  });


  if(!creator){
    return NextResponse.json([]);
  }



  const { searchParams } = new URL(req.url);

  const range = searchParams.get("range") || "week";



  const earnings = await prisma.earning.findMany({

    where:{
      creatorId:creator.id,
      status:"WITHDRAWN",
      withdrawnAt:{
        not:null
      }
    },

    orderBy:{
      withdrawnAt:"asc"
    }

  });



  const grouped:Record<string,number> = {};



  earnings.forEach((earning)=>{

    const date = new Date(earning.withdrawnAt!);


    let key="";


    if(range==="week"){

      key=date.toLocaleDateString(
        "en-US",
        {
          weekday:"short"
        }
      );

    }



    if(range==="month"){

      const week=Math.ceil(
        date.getDate()/7
      );

      key=`Week ${week}`;

    }




    if(range==="year"){

      key=date.toLocaleDateString(
        "en-US",
        {
          month:"short"
        }
      );

    }



    grouped[key]=(grouped[key] || 0)+earning.creatorAmount;

  });





  let labels:string[]=[];



  if(range==="week"){

    labels=[
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun"
    ];

  }




  if(range==="month"){

    labels=[
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
      "Week 5"
    ];

  }





  if(range==="year"){

    labels=[
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

  }






  const data = labels.map(label=>({

    label,

    value: grouped[label] ?? 0

  }));




  return NextResponse.json(data);

}