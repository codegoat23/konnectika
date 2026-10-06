// app/api/webhooks/clerk/route.ts
//
// Keeps Clerk and Prisma users synchronized.
//
// Authentication of this endpoint comes from Svix via verifyWebhook(), which
// checks the `svix-id` / `svix-timestamp` / `svix-signature` headers against
// CLERK_WEBHOOK_SIGNING_SECRET. That is why proxy.ts must leave this path
// public — Clerk cannot present a session for a request whose signature is
// what we're trying to trust.
//
// Handled events:
//   user.created  -> create/link the Prisma row
//   user.updated  -> sync profile fields (never role)
//   user.deleted  -> remove the Prisma row
//
// Every handler is keyed on the Clerk user id and is safe to run repeatedly,
// because Clerk retries webhooks on any non-2xx.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import {
  ensurePrismaUserForClerkUser,
  syncClerkProfile,
  deletePrismaUserForClerkUser,
} from "@/lib/clerk-sync";

// NextRequest (not Request) — verifyWebhook's RequestLike type expects the
// Next-specific fields.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    // 400 => Clerk will not retry; the signature was invalid.
    console.error("[clerk-webhook] signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (evt.type) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name } = evt.data;

        const result = await ensurePrismaUserForClerkUser(
          {
            id,
            emailAddress:
              email_addresses.find((e) => e.id === evt.data.primary_email_address_id)
                ?.email_address ?? email_addresses[0]?.email_address ?? null,
            firstName: first_name ?? null,
            lastName: last_name ?? null,
          },
          // Intentionally NOT forwarded from Clerk metadata here. The webhook
          // is an out-of-band event; taking a role from it would mean trusting
          // public metadata written by the client. Role is resolved by the
          // signup path (which sanitizes to CREATOR/BRAND) or by the env
          // admin bootstrap, so an existing user keeps whatever role they had.
          undefined
        );

        return NextResponse.json({ ok: true, action: "created", userId: result.userId });
      }

      case "user.updated": {
        const { id, email_addresses, first_name, last_name } = evt.data;

        await ensurePrismaUserForClerkUser({
          id,
          emailAddress:
            email_addresses.find((e) => e.id === evt.data.primary_email_address_id)
              ?.email_address ?? email_addresses[0]?.email_address ?? null,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
        });
        await syncClerkProfile({
          id,
          emailAddress:
            email_addresses[0]?.email_address ??
            email_addresses.find((e) => e.id === evt.data.primary_email_address_id)
              ?.email_address ??
            null,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
        });

        return NextResponse.json({ ok: true, action: "updated" });
      }

      case "user.deleted": {
        // DeletedObjectJSON types `id` as optional, so don't assume it.
        const id = evt.data.id;
        if (!id) {
          // Acknowledge rather than 500: retrying can't conjure the id back,
          // and Clerk will not resend a payload that never contained one.
          console.warn("[clerk-webhook] user.deleted had no id; nothing to do");
          return NextResponse.json({ ok: true, action: "ignored", reason: "no id" });
        }

        const result = await deletePrismaUserForClerkUser(id);
        return NextResponse.json({ ok: true, action: "deleted", ...result });
      }

      default: {
        // Acknowledge everything else so Clerk stops retrying.
        return NextResponse.json({ ok: true, action: "ignored" });
      }
    }
  } catch (err) {
    // 500 => Clerk retries, which is what we want: the sync is idempotent.
    console.error(`[clerk-webhook] ${evt.type} failed:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}