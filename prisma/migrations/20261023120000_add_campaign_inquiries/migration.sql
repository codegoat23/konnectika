CREATE TABLE "CampaignInquiry" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT NOT NULL,
    "campaignTypes" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "platforms" TEXT NOT NULL,
    "creatorCount" TEXT,
    "budget" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "additional" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignInquiry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CampaignInquiry_createdAt_idx" ON "CampaignInquiry"("createdAt");
CREATE INDEX "CampaignInquiry_email_idx" ON "CampaignInquiry"("email");
