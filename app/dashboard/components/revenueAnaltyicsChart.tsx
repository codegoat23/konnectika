"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";


// ---------------------------------------------
// Types
// ---------------------------------------------

interface RevenuePoint {
  label: string;
  value: number;
}


// ---------------------------------------------
// Range
// ---------------------------------------------

const RANGE_OPTIONS = [
  {
    label: "This Week",
    value: "week",
  },
  {
    label: "This Month",
    value: "month",
  },
  {
    label: "This Year",
    value: "year",
  },
];


// ---------------------------------------------
// Chart config
// ---------------------------------------------

const chartConfig = {
  value: {
    label: "Revenue",
    color: "#f97316",
  },
} satisfies ChartConfig;



// ---------------------------------------------
// Custom bar
// ---------------------------------------------

interface CapsuleBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex:number|null;
}


function CapsuleBar({
  x=0,
  y=0,
  width=0,
  height=0,
  index=0,
  activeIndex
}:CapsuleBarProps){

  const radius = width / 2;

  const active = index === activeIndex;


  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={radius}
      ry={radius}
      fill={
        active
        ? "var(--color-value)"
        : "url(#barStripes)"
      }
    />
  );
}



// ---------------------------------------------
// Main
// ---------------------------------------------

export function RevenueAnalyticsChart(){

  const [range,setRange] = React.useState("week");

  const [chartData,setChartData] =
    React.useState<RevenuePoint[]>([]);


  const [activeIndex,setActiveIndex] =
    React.useState<number|null>(null);



  React.useEffect(()=>{

    async function getRevenue(){

      const response = await fetch(
        `/api/creator/revenue?range=${range}`
      );


      const data = await response.json();

      setChartData(data);


      if(data.length){
        setActiveIndex(
          data.findIndex(
            (item:RevenuePoint)=>
            item.label === data[0].label
          )
        );
      }

    }


    getRevenue();


  },[range]);




  const currentRange =
    RANGE_OPTIONS.find(
      item=>item.value===range
    )?.label;



  return (

<Card className="@container/card bg-card backdrop-blur-md rounded-2xl">


<CardHeader>

<CardTitle className="text-lg font-semibold">
Revenue analytics
</CardTitle>


<CardAction>

<DropdownMenu>

<DropdownMenuTrigger asChild>

<Button
variant="outline"
className="rounded-full gap-2 text-xs font-medium"
>

{currentRange}

<ChevronDownIcon className="size-3.5"/>

</Button>

</DropdownMenuTrigger>



<DropdownMenuContent align="end">

{
RANGE_OPTIONS.map(option=>(

<DropdownMenuItem
key={option.value}
onClick={()=>setRange(option.value)}
>

{option.label}

</DropdownMenuItem>

))
}

</DropdownMenuContent>


</DropdownMenu>


</CardAction>


</CardHeader>



<CardContent className="pt-4">


<ChartContainer
config={chartConfig}
className="aspect-auto h-[320px] w-full"
>


<BarChart

data={chartData}

margin={{
top:20,
right:8,
left:0,
bottom:0
}}

onMouseLeave={()=>
setActiveIndex(0)
}

>


<defs>

<pattern

id="barStripes"

patternUnits="userSpaceOnUse"

width={8}

height={8}

patternTransform="rotate(45)"

>

<rect
width={8}
height={8}
fill="var(--color-value)"
fillOpacity={0.18}
/>


<line

x1={0}
y1={0}
x2={0}
y2={8}

stroke="var(--color-value)"

strokeWidth={4}

strokeOpacity={0.55}

/>


</pattern>


</defs>




<CartesianGrid
vertical={false}
strokeDasharray="4 4"
/>



<YAxis

tickLine={false}

axisLine={false}

tickFormatter={(v:number)=>
`${v/1000}k`
}

tick={{
fontSize:12,
fill:"var(--muted-foreground)"
}}

width={40}

/>



<XAxis

dataKey="label"

tickLine={false}

axisLine={false}

tick={{
fontSize:13,
fill:"var(--muted-foreground)"
}}

/>




<ChartTooltip

cursor={false}

content={

<ChartTooltipContent
className="bg-popover rounded-[10] border-border"
formatter={(value)=>
[
`$${Number(value).toLocaleString()}`,
"Paid earnings"
]
}

indicator="dot"

/>

}

/>





<Bar

dataKey="value"

maxBarSize={56}


onMouseEnter={(_,index)=>
setActiveIndex(index)
}


shape={(props:unknown)=>(

<CapsuleBar

{...(props as CapsuleBarProps)}

activeIndex={activeIndex}

/>

)}


/>


</BarChart>


</ChartContainer>


</CardContent>


</Card>

  );
}