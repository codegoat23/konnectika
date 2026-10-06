// instrumentation.ts
//
// Runs once when a new Next.js server instance starts, before it serves any
// request. Used here to guarantee the env-configured admin accounts exist
// before anyone can try to log in with them.
//
// Node runtime only: bcrypt and Prisma are not available on the edge runtime.

import { ensureAdminUsers } from "@/lib/admin-bootstrap";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  try {
    const result = await ensureAdminUsers();

    if (result.created.length > 0) {
      console.log(
        `[admin-bootstrap] created ${result.created.length} admin account(s) from ADMIN_EMAILS: ${result.created.join(", ")}`
      );
    }
    if (result.passwordSynced.length > 0) {
      console.log(
        `[admin-bootstrap] ADMIN_PASSWORD changed; re-synced: ${result.passwordSynced.join(", ")}`
      );
    }
  } catch (error) {
    // Logged, not thrown. A database that isn't up yet at boot shouldn't
    // crash-loop the whole app; the next start retries.
    console.error("[admin-bootstrap] failed to sync admin accounts:", error);
  }
}