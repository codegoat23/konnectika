import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const OTP_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const OTP_COOKIE = "phone_otp";
const OTP_TTL_SECONDS = 10 * 60;

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(phone: string): Promise<string> {
  const otp = generateOtp();

  const token = await new SignJWT({ otpHash: hashOtp(otp), phone })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${OTP_TTL_SECONDS}s`)
    .sign(OTP_SECRET);

  const store = await cookies();
  store.set(OTP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OTP_TTL_SECONDS,
  });

  return otp;
}

export async function verifyOtp(otp: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(OTP_COOKIE)?.value;

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, OTP_SECRET);
    return payload.otpHash === hashOtp(otp);
  } catch {
    return false;
  }
}

export async function clearOtpCookie(): Promise<void> {
  const store = await cookies();
  store.delete(OTP_COOKIE);
}
