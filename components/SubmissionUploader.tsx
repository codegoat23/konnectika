"use client";

import {
 UploadButton
} from "@uploadthing/react";


import type {
 OurFileRouter
} from "@/app/api/uploadthing/core";


export default function SubmissionUploader({
 onUploadComplete
}:{
 onUploadComplete:(urls:string[])=>void
}){


return (

<UploadButton<OurFileRouter, "submissionProof">

endpoint="submissionProof"


onClientUploadComplete={(files)=>{

 const urls = files.map(
   file=>file.ufsUrl
 );

 onUploadComplete(urls);

}}


onUploadError={(error)=>{

 alert(error.message);

}}

/>

)

}