// tests/setup.ts
//
// Runs before every test file. Responsibilities:
//   1. Load .env (fee percentages) and point
//      DATABASE_URL at the isolated test database BEFORE any module that reads
//      DATABASE_URL (lib/prisma.ts) is imported.
//   2. Register the next/headers cookie-jar mock (see cookie-jar.ts).
//   3. Register the Clerk session mock (see clerk-jar.ts), which replaces the
//      old JWT-cookie sign-in for tests.
//
// The test database (konnectika_test) must exist with migrations applied:
//   psql -c "CREATE DATABASE konnectika_test;"
//   DATABASE_URL=... npx prisma migrate deploy

import "dotenv/config";
import "./cookie-jar";
import "./clerk-jar";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:1234@localhost:5432/konnectika_test";
