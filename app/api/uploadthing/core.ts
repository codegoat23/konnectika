import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getSessionUser } from "@/lib/getSessionUser";

const f = createUploadthing();


export const ourFileRouter = {

  submissionProof: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })

  .middleware(async () => {

    const user = await getSessionUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "CREATOR") {
      throw new Error("Only creators can upload");
    }


    return {
      creatorId: user.creatorProfileId,
    };

  })


  .onUploadComplete(async ({ metadata, file }) => {


    console.log("Upload complete");

    console.log({
      creatorId: metadata.creatorId,
      url: file.url,
    });


    return {
      uploadedBy: metadata.creatorId,
      url: file.url,
    };

  }),


} satisfies FileRouter;


export type OurFileRouter = typeof ourFileRouter;