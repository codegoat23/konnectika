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

  campaignCover: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })

  .middleware(async () => {

    const user = await getSessionUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "BRAND") {
      throw new Error("Only brands can upload cover images");
    }

    return {
      brandId: user.businessProfileId,
    };

  })

  .onUploadComplete(async ({ metadata, file }) => {

    console.log("Cover image uploaded", {
      brandId: metadata.brandId,
      url: file.url,
    });

    return {
      uploadedBy: metadata.brandId,
      url: file.url,
    };

  }),

  brandLogo: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getSessionUser();
      if (!user) throw new Error("Unauthorized");
      if (user.role !== "BRAND" || !user.businessProfileId) {
        throw new Error("Only brands can upload a logo");
      }
      return { brandId: user.businessProfileId };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.brandId,
      url: file.ufsUrl ?? file.url,
    })),

  paymentProof: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })

  .middleware(async () => {

    const user = await getSessionUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Brands upload proof for their campaign payment; admins upload proof
    // that they paid a creator payout.
    if (user.role !== "BRAND" && user.role !== "ADMIN") {
      throw new Error("Only brands and admins can upload payment proof");
    }

    return {
      uploadedBy: user.id,
    };

  })


  .onUploadComplete(async ({ metadata, file }) => {


    console.log("Payment proof uploaded", {
      uploadedBy: metadata.uploadedBy,
      url: file.url,
    });


    return {
      uploadedBy: metadata.uploadedBy,
      url: file.url,
    };

  }),

} satisfies FileRouter;


export type OurFileRouter = typeof ourFileRouter;
