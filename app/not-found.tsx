import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/assets/logo-plain.svg";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <Link href="/" aria-label="Konnectika home">
        <Image
          src={Logo}
          alt="Konnectika"
          width={190}
          height={36}
          priority
          className="h-auto w-auto max-w-[190px]"
        />
      </Link>

      <p className="mt-10 text-8xl font-bold tracking-tight text-foreground">
        404
      </p>

      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been
        moved. Check the URL or head back to a page that works.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-orange-400"
        >
          Back to Home
        </Link>

        <Link
          href="/discover"
          className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground"
        >
          Discover Campaigns
        </Link>
      </div>
    </main>
  );
}
