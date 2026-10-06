// tests/cookie-jar.ts
//
// Registers the `next/headers` mock used by every marketplace test.
//
// lib/auth.ts reads the Clerk session via `cookies()` from next/headers, which
// does not exist outside the Next.js runtime — so we substitute an in-memory
// cookie jar. Identity itself now comes from tests/clerk-jar.ts, which mocks
// `auth()` to return the signed-in Clerk user id; the jar exists so anything
// else that touches cookies during a request has somewhere to read from.
//
// The JWT-cookie helpers that used to live here are gone: the app no longer
// reads or writes a self-signed `token` cookie.

import { vi } from "vitest";

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

/** Seeds a cookie for tests that need to exercise a specific cookie value. */
export function setCookie(name: string, value: string): void {
  jar.set(name, value);
}

export function clearCookies(): void {
  jar.clear();
}