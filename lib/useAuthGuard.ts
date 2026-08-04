"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(requiredRole?: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/auth/me");
        const user = await res.json();

        if (!user || !user.role) {
          router.push("/login");
          return;
        }

        if (requiredRole && user.role !== requiredRole) {
          router.push("/dashboard/campaigns/unauthorized");
          return;
        }

        setLoading(false);
      } catch {
        router.push("/login");
      }
    }

    check();
  }, [requiredRole, router]);

  return { loading };
}