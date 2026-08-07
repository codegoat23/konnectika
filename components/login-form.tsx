"use client";

import { cn } from "@/lib/utils";
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

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") || "";

  const [email, setEmail] = useState("");
  const [message,setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          redirectTo, // 🔥 IMPORTANT
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Invalid credentials");
      }

      // 🔥 SMART REDIRECT (from backend)
      router.push(data.redirectTo || "/dashboard");

    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 items-center", className)} {...props}>
      <Card className="w-full max-w-md rounded-[32px] shadow-xl border border-border backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Welcome back
          </CardTitle>

          <CardDescription className="text-sm text-muted-foreground">
            Login to continue 
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup className="space-y-5">

              {/* EMAIL */}
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-[14] border-1 border-border"
                 
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
                    className="h-11 rounded-[14] border-border pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-[14] bg-primary text-primary-foreground hover:bg-orange-400"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <FieldDescription className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href={`/signup?redirectTo=${redirectTo}`} className="font-medium underline">
                  Sign up
                </a>
              </FieldDescription>

            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}