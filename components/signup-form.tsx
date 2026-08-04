"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import { Eye, EyeOff } from "lucide-react";

type Role = "CREATOR" | "BRAND";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") || "";

  const [role, setRole] = useState<Role>("CREATOR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          redirectTo, // 🔥 IMPORTANT
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Signup failed");
      }

      // 🔥 SMART REDIRECT
      router.push(data.redirectTo || "/onboarding");

    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

 return (
  <div
    className={cn("flex flex-col gap-6 items-center", className)}
    {...props}
  >
    <Card className="w-full max-w-md rounded-[32px] shadow-xl border border-white/20 backdrop-blur-xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Create Account
        </CardTitle>

        <CardDescription className="text-sm text-gray-500">
          {role === "CREATOR"
            ? "Join and start earning"
            : "Join and start creating campaigns"}
        </CardDescription>

        {/* ROLE SELECTOR */}
        <div className="flex rounded-[24] bg-white/10  p-1 mt-4">
          <button
            type="button"
            onClick={() => setRole("CREATOR")}
            className={cn(
              "flex-1 rounded-[24] py-2 text-sm font-medium transition-all",
              role === "CREATOR"
                ? "bg-orange-500 text-white shadow"
                : "text-muted-foreground"
            )}
          >
            Creator
          </button>

          <button
            type="button"
            onClick={() => setRole("BRAND")}
            className={cn(
              "flex-1 rounded-[24] py-2 text-sm font-medium transition-all",
              role === "BRAND"
                ? "bg-orange-500 text-white shadow"
                : "text-muted-foreground"
            )}
          >
            Brand
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSignup}>
          <FieldGroup className="space-y-5">
            {/* NAME */}
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 rounded-[14px] border border-white/10"
              />
            </Field>

            {/* EMAIL */}
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-[14px] border border-white/10"
              />
            </Field>

            {/* PASSWORD */}
            <Field>
              <FieldLabel>Password</FieldLabel>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-[14px] border border-white/10 pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </Field>

            {/* CONFIRM PASSWORD */}
            <Field>
              <FieldLabel>Confirm Password</FieldLabel>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 rounded-[14px] border border-white/10 pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((v) => !v)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[14px] bg-white text-black hover:bg-orange-600"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <FieldDescription className="text-center text-sm">
              Already have an account?{" "}
              <a
                href={`/login?redirectTo=${redirectTo}`}
                className="font-medium underline"
              >
                Login
              </a>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
);
}