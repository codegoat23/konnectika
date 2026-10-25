"use client";

import { useOnboardingGuard } from "@/hooks/useOnboardingGuard";

export default function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  useOnboardingGuard();
  return <>{children}</>;
}
