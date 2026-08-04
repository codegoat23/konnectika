
"use client"

import React from "react";
import { NavUser } from "./nav-user";



export interface UserData {
    name: string
    email: string
    avatar: string
}

export  function SidebarUser() {

    const [user,setUser] = React.useState<UserData>({
        name: "",
        email: "",
        avatar: ""
    });
     React.useEffect(()=>{
    
        async function getUserData(){
    
          const res = await fetch("/api/user")
          if(!res.ok) return;
          
          const data = await res.json()
    
          setUser(data.User);
    
        }
    
    
        getUserData();
    
    
      },[]);
   
   console.log("user", user)
  return (
    <div>
      <NavUser user={user} />
    </div>
  )
}

