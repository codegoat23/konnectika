import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import QueryProvider from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Konnectika — Where African creativity meets opportunity",
  description:
    "Konnectika connects creators with brands looking for authentic content. Discover campaigns, create, collaborate, and get rewarded.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://wekonnectika.com"),
  openGraph: {
    title: "Konnectika — Where African creativity meets opportunity",
    description:
      "Konnectika connects creators with brands looking for authentic content. Discover campaigns, create, collaborate, and get rewarded.",
    url: "/",
    siteName: "Konnectika",
    type: "website",
    images: [
      {
        url: "/assets/link-banner.webp",
        width: 1080,
        height: 630,
        alt: "Konnectika — Where African creativity meets opportunity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konnectika — Where African creativity meets opportunity",
    description:
      "Konnectika connects creators with brands looking for authentic content. Discover campaigns, create, collaborate, and get rewarded.",
    images: ["/assets/link-banner.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} h-full antialiased bg-background text-foreground`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ClerkProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ClerkProvider>
          </QueryProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
