import { redirect } from "next/navigation";
import { getAuthUser, FIRST_STEP_BY_ROLE } from "@/lib/auth";

const ONBOARDING_STEPS: Record<string, Record<number, string>> = {
  CREATOR: {
    1: "/onboarding/username",
    2: "/onboarding/socials",
    3: "/onboarding/phone",
    4: "/onboarding/otp",
  },
  BRAND: {
    1: "/onboarding/companyname",
    2: "/onboarding/brand-socials",
    3: "/onboarding/brand-details",
    4: "/onboarding/welcome",
  },
};

export default async function OnboardingIndexPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.onboardingDone) {
    redirect("/dashboard");
  }

  const steps = ONBOARDING_STEPS[user.role];
  const target = steps?.[user.onboardingStep] ?? FIRST_STEP_BY_ROLE[user.role];

  redirect(target ?? "/login");
}
