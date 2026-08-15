import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { setAuthToken } from "./cookie-jar";
import { GET as campaignsGET } from "@/app/api/campaigns/route";

describe("infrastructure smoke", () => {
  it("connects to the test database", async () => {
    const { id } = await prisma.user.create({
      data: { email: "smoke@test.konnectika.local", role: "ADMIN" },
    });
    const found = await prisma.user.findUnique({ where: { id } });
    expect(found?.email).toBe("smoke@test.konnectika.local");
    await prisma.user.delete({ where: { id } });
  });

  it("signs tokens and sets the cookie", async () => {
    const token = await signToken({
      userId: "u_test",
      role: "ADMIN",
      onboardingDone: true,
      onboardingStep: 1,
      type: "email",
    });
    setAuthToken(token);
    expect(token.split(".").length).toBe(3);
  });

  it("imports and runs an API route (NextResponse works)", async () => {
    const res = await campaignsGET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
