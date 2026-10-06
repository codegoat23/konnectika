"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useOnboardingGuard() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      const step = data.user.onboardingStep;
      const role = data.user.role;

      const map: Record<number, string> =
        role === "CREATOR"
          ? {
              0: "/onboarding/role",
              1: "/onboarding/username",
              2: "/onboarding/socials",
            }
          : {
        0: "/onboarding/role",
        1: "/onboarding/companyname",
        2: "/onboarding/brand-socials",
        3: "/onboarding/brand-details",
        4: "/onboarding/welcome"
            };

      const expected = map[step];

      if (expected && !window.location.pathname.startsWith(expected)) {
        router.push(expected);
      }

      if (data.user.onboardingDone) {
        router.push("/dashboard");
      }
    }

    check();
  }, [router]);
}
