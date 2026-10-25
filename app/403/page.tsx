import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access denied | Konnectika",
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">
        🚫 Access Denied
      </h1>
    </div>
  );
}
