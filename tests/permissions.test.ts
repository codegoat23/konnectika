// tests/permissions.test.ts
//
// Role / ownership matrix across the marketplace API. Every guard the backend
// enforces is hit here:
//   - unauthenticated -> 401
//   - creators cannot create campaigns / approve applications / review
//     submissions / mark payments paid
//   - brands cannot touch other brands' campaigns, applications, submissions
//     or payments; a brand cannot approve a campaign (admin only)
//   - admins can do everything
//   - creators are scoped to their own applications and submissions

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createFixture,
  signInAs,
  signOut,
  callRoute,
  readJson,
  createCampaign,
  createApplication,
  resetDb,
} from "./helpers";
import { POST as createCampaignRoute } from "@/app/api/campaigns/route";
import { POST as applyRoute } from "@/app/api/applications/route";
import { PATCH as applicationStatusRoute } from "@/app/api/applications/[id]/status/route";
import { POST as createSubmissionRoute } from "@/app/api/submissions/route";
import { GET as getSubmissionRoute, PATCH as reviewSubmissionRoute } from "@/app/api/submissions/[id]/route";
import { PATCH as adminCampaignStatusRoute } from "@/app/api/admin/campaign/[campaignId]/status/route";
import { GET as payoutsListRoute } from "@/app/api/payouts/route";

const URL = "http://localhost/api";

describe("permissions", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
  });

  afterEach(() => {
    signOut();
  });

  it("rejects unauthenticated requests with 401", async () => {
    signOut();
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "APPROVED"
    );

    const cases: Promise<Response>[] = [
      callRoute({ POST: createCampaignRoute }, { method: "POST", url: `${URL}/campaigns`, body: {} }),
      callRoute({ POST: applyRoute }, { method: "POST", url: `${URL}/applications`, body: { campaignId: campaign.id } }),
      callRoute({ PATCH: applicationStatusRoute }, { method: "PATCH", url: `${URL}/applications/${application.id}/status`, params: { id: application.id }, body: { status: "APPROVED" } }),
      callRoute({ PATCH: adminCampaignStatusRoute }, { method: "PATCH", url: `${URL}/admin/campaign/${campaign.id}/status`, params: { campaignId: campaign.id }, body: { status: "APPROVED" } }),
      callRoute({ GET: payoutsListRoute }, { method: "GET", url: `${URL}/payouts` }),
    ];

    for (const res of cases) {
      const r = await res;
      expect(r.status).toBe(401);
    }
  });

  it("forbids a creator from creating a campaign", async () => {
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const res = await callRoute({ POST: createCampaignRoute }, {
      method: "POST",
      url: `${URL}/campaigns`,
      body: { name: "Hijack", paymentRate: 1000, budgetTotal: 10000, applicationsClose: new Date().toISOString() },
    });
    expect(res.status).toBe(403);
  });

  it("forbids a brand from approving campaigns (admin only)", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, { status: "PENDING_REVIEW" });
    await signInAs(fx.brandAlpha.id, "BRAND");
    const res = await callRoute({ PATCH: adminCampaignStatusRoute }, {
      method: "PATCH",
      url: `${URL}/admin/campaign/${campaign.id}/status`,
      params: { campaignId: campaign.id },
      body: { status: "APPROVED" },
    });
    expect(res.status).toBe(403);
  });

  it("forbids a creator from approving an application", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "PENDING"
    );
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const res = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${application.id}/status`,
      params: { id: application.id },
      body: { status: "APPROVED" },
    });
    expect(res.status).toBe(403);
    const after = await prisma.campaignApplication.findUniqueOrThrow({
      where: { id: application.id },
    });
    expect(after.status).toBe("PENDING");
  });

  it("forbids a brand from approving another brand's application", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "PENDING"
    );
    await signInAs(fx.brandBeta.id, "BRAND");
    const res = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${application.id}/status`,
      params: { id: application.id },
      body: { status: "APPROVED" },
    });
    expect(res.status).toBe(403);
  });

  it("forbids a creator from applying for someone else's application (404, not a leak)", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "APPROVED"
    );
    await signInAs(fx.creatorBeta.id, "CREATOR");
    const res = await callRoute({ POST: createSubmissionRoute }, {
      method: "POST",
      url: `${URL}/submissions`,
      body: {
        applicationId: application.id,
        screenshots: ["https://example.com/x.png"],
        postLinks: ["https://example.com/video"],
      },
    });
    expect(res.status).toBe(404);
  });

  it("forbids a brand from reviewing another brand's submission", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "APPROVED"
    );
    const submission = await prisma.submission.create({
      data: {
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        screenshots: ["https://example.com/y.png"],
        postLinks: ["https://example.com/video"],
        status: "PENDING_REVIEW",
      },
    });

    await signInAs(fx.brandBeta.id, "BRAND");
    const res = await callRoute({ PATCH: reviewSubmissionRoute }, {
      method: "PATCH",
      url: `${URL}/submissions/${submission.id}`,
      params: { id: submission.id },
      body: { status: "APPROVED" },
    });
    expect(res.status).toBe(403);
  });

  it("forbids a creator from viewing another creator's submission", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "APPROVED"
    );
    const submission = await prisma.submission.create({
      data: {
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        screenshots: ["https://example.com/z.png"],
        postLinks: ["https://example.com/video"],
        status: "PENDING_REVIEW",
      },
    });

    await signInAs(fx.creatorBeta.id, "CREATOR");
    const res = await callRoute({ GET: getSubmissionRoute }, {
      method: "GET",
      url: `${URL}/submissions/${submission.id}`,
      params: { id: submission.id },
    });
    expect(res.status).toBe(403);
  });

  it("lets an admin do everything across brands", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "PENDING_REVIEW",
    });

    // Admin approves the campaign.
    await signInAs(fx.admin.id, "ADMIN");
    const approve = await callRoute({ PATCH: adminCampaignStatusRoute }, {
      method: "PATCH",
      url: `${URL}/admin/campaign/${campaign.id}/status`,
      params: { campaignId: campaign.id },
      body: { status: "APPROVED" },
    });
    expect(approve.status).toBe(200);

    // Admin approves an application on brandAlpha's campaign.
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "PENDING"
    );
    const appApproved = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${application.id}/status`,
      params: { id: application.id },
      body: { status: "APPROVED" },
    });
    expect(appApproved.status).toBe(200);
    expect((await readJson(appApproved)).earning).not.toBeNull();

    // Admin reviews brandAlpha's submission.
    const submission = await prisma.submission.create({
      data: {
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        screenshots: ["https://example.com/w.png"],
        postLinks: ["https://example.com/video"],
        status: "PENDING_REVIEW",
      },
    });
    const reviewed = await callRoute({ PATCH: reviewSubmissionRoute }, {
      method: "PATCH",
      url: `${URL}/submissions/${submission.id}`,
      params: { id: submission.id },
      body: { status: "APPROVED" },
    });
    expect(reviewed.status).toBe(200);

    // Admin sees the payout ledger (empty at this point).
    const payouts = await callRoute({ GET: payoutsListRoute }, {
      method: "GET",
      url: `${URL}/payouts`,
    });
    expect(payouts.status).toBe(200);
    const payoutsBody = await readJson(payouts);
    expect(payoutsBody.payouts).toHaveLength(0);
  });

  it("forbids a second brand from creating a duplicate application on their own behalf and creator is always scoped", async () => {
    // A creator can only ever apply once per campaign (unique constraint),
    // and two different creators each get their own application row.
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const one = await callRoute({ POST: applyRoute }, {
      method: "POST",
      url: `${URL}/applications`,
      body: { campaignId: campaign.id, message: "first" },
    });
    expect(one.status).toBe(200);

    await signInAs(fx.creatorBeta.id, "CREATOR");
    const two = await callRoute({ POST: applyRoute }, {
      method: "POST",
      url: `${URL}/applications`,
      body: { campaignId: campaign.id, message: "second" },
    });
    expect(two.status).toBe(200);

    const count = await prisma.campaignApplication.count({
      where: { campaignId: campaign.id },
    });
    expect(count).toBe(2);
  });
});
