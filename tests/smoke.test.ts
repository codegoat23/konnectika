import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { setClerkSession, clearClerkSession } from "./clerk-jar";
import { GET as campaignsGET } from "@/app/api/campaigns/route";
import { signInAs, signOut } from "./helpers";

describe("infrastructure smoke", () => {
  it("connects to the test database", async () => {
    const { id } = await prisma.user.create({
      data: { email: "smoke@test.konnectika.local", role: "ADMIN" },
    });
    const found = await prisma.user.findUnique({ where: { id } });
    expect(found?.email).toBe("smoke@test.konnectika.local");
    await prisma.user.delete({ where: { id } });
  });

  it("resolves identity from a Clerk session, not a forged cookie", async () => {
    const { id } = await prisma.user.create({
      data: {
        email: "smoke-session@test.konnectika.local",
        role: "BRAND",
        clerkUserId: "user_smoke_session",
      },
    });

    // No session at all -> signed out.
    clearClerkSession();
    const { getAuthUser } = await import("@/lib/auth");
    expect(await getAuthUser()).toBeNull();

    // Clerk session for this user -> resolved, with role read from Prisma.
    setClerkSession("user_smoke_session");
    const user = await getAuthUser();
    expect(user?.userId).toBe(id);
    expect(user?.role).toBe("BRAND");

    clearClerkSession();
    await prisma.user.delete({ where: { id } });
  });

  it("signs a fixture user in and back out", async () => {
    const { id } = await prisma.user.create({
      data: { email: "smoke-signin@test.konnectika.local", role: "CREATOR" },
    });
    await signInAs(id, "CREATOR");
    const { getAuthUser } = await import("@/lib/auth");
    expect((await getAuthUser())?.userId).toBe(id);

    signOut();
    expect(await getAuthUser()).toBeNull();
    await prisma.user.delete({ where: { id } });
  });

  it("imports and runs an API route (NextResponse works)", async () => {
    const res = await campaignsGET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
