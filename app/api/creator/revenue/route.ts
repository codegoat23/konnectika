import { NextResponse } from "next/server";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: user.userId },
    select: { id: true },
  });
  if (!creator) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "week";
  const now = new Date();
  let start: Date;
  let end: Date;
  let labels: string[];
  let getLabel: (date: Date) => string;

  if (range === "week") {
    start = startOfWeek(now, { weekStartsOn: 1 });
    end = endOfWeek(now, { weekStartsOn: 1 });
    labels = eachDayOfInterval({ start, end }).map((date) => format(date, "EEE"));
    getLabel = (date) => format(date, "EEE");
  } else if (range === "month") {
    start = startOfMonth(now);
    end = endOfMonth(now);
    labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    getLabel = (date) => `Week ${Math.ceil(date.getDate() / 7)}`;
  } else if (range === "year") {
    start = startOfYear(now);
    end = endOfYear(now);
    labels = eachMonthOfInterval({ start, end }).map((date) => format(date, "MMM"));
    getLabel = (date) => format(date, "MMM");
  } else {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const earnings = await prisma.earning.findMany({
    where: {
      creatorId: creator.id,
      status: "PAID",
      paidAt: { gte: start, lte: end },
    },
    select: { creatorAmount: true, paidAt: true },
  });

  const grouped: Record<string, number> = {};
  earnings.forEach((earning) => {
    if (!earning.paidAt) return;
    const label = getLabel(earning.paidAt);
    grouped[label] = (grouped[label] ?? 0) + earning.creatorAmount;
  });

  return NextResponse.json(
    labels.map((label) => ({ label, value: grouped[label] ?? 0 }))
  );
}
