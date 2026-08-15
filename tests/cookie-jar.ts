// tests/cookie-jar.ts
//
// Registers the `next/headers` mock used by every marketplace test. The
// JWT-cookie auth in lib/auth.ts calls `cookies()` from next/headers, which
// does not exist outside the Next.js runtime — so we substitute an in-memory
// cookie jar. Tests sign in by minting a real JWT (lib/auth.signToken) and
// dropping it into this jar via setAuthToken().

import { vi } from "vitest";

// vi.hoisted values cannot be exported directly (they are hoisted above the
// import statements), so the jar is kept private and accessed via the exported
// helpers below.
const jar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

export function setAuthToken(token: string): void {
  jar.set("token", token);
}

export function clearAuthToken(): void {
  jar.clear();
}
