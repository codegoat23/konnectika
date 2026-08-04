"use client";

import { useOnboardingGuard } from "@/hooks/useOnboardingGuard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useOnboardingGuard();

  return <>{children}</>;
}