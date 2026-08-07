"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import NotificationDrawer from "./NotificationDrawer";


export default function NotificationBell(){


const [open,setOpen]=useState(false);


return (

<>
<button
onClick={()=>setOpen(true)}
className="relative cursor-pointer font-light border p-1 rounded-[8] border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors"
>

<Bell size={22} strokeWidth={1.0}/>


<div
className="
absolute
top-0
right-0.5
bg-orange-500
text-white
rounded-full
text-xs
px-1
w-2
h-2
"
>

</div>


</button>


<NotificationDrawer
open={open}
setOpen={setOpen}
/>

</>

)

}