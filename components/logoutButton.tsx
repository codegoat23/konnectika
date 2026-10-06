"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      // Let Clerk clear its client state and revoke the active session before
      // navigating. A router-only redirect leaves Clerk's provider signed in,
      // which can bounce /login straight back into the authenticated app.
      await signOut({ redirectUrl: "/login" });
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2   text-sm font-medium    disabled:opacity-50  text-foreground transition-colors rounded-2xl hover:text-orange-400"
      style={
        {borderRadius:"14px"}
      }
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}

      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}
