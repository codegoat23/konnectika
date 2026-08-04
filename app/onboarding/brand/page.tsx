"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function BrandOnboardingPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const data = {
        companyName: formData.get("companyName"),
        website: formData.get("website"),
        industry: formData.get("industry"),
        description: formData.get("description"),
      };

      const res = await fetch(
        "/api/onboarding/brand",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );


      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        console.error("Failed to save brand profile");
      }

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-6">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-6"
      >

        <div>
          <h1 className="text-3xl font-bold">
            Tell us about your brand
          </h1>

          <p className="text-muted-foreground">
            This helps creators understand who they are working with.
          </p>
        </div>


        <div className="space-y-2">
          <label>
            Company name
          </label>

          <Input
            name="companyName"
            placeholder="Nike Tanzania"
            required
          />
        </div>


        <div className="space-y-2">
          <label>
            Website
          </label>

          <Input
            name="website"
            placeholder="https://example.com"
          />
        </div>


        <div className="space-y-2">
          <label>
            Industry
          </label>

          <Input
            name="industry"
            placeholder="Fashion, Tech, Food..."
          />
        </div>


        <div className="space-y-2">
          <label>
            About your company
          </label>

          <Textarea
            name="description"
            placeholder="Tell creators about your brand..."
          />
        </div>


        <Button
          disabled={loading}
          className="w-full"
        >
          {loading ? "Saving..." : "Complete setup"}
        </Button>

      </form>

    </div>
  );
}