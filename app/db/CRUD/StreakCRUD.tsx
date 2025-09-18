import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { dayTable, streakTable } from "../schema";

export async function getOrderedDays() {
  const result = await db.select({ id: dayTable.id }).from(dayTable);

  const ordered = result.sort((a, b) => {
    const parseDateFromId = (id: string) => {
      const datePart = id.replace("dayInfo:", "").trim();
      const [dayStr, monthStr, yearStr] = datePart.split("-");

      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      return Date.UTC(year, month - 1, day);
    };

    return parseDateFromId(a.id) - parseDateFromId(b.id);
  });
  return ordered;
}

export async function getLastFailedDay() {
  const result = await db.select({ id: dayTable.id })
    .from(dayTable)
    .where(eq(dayTable.isFailed, 1))
    .orderBy(desc(dayTable.id))
    .limit(1)
  return result[0] || null;
}

export async function getAllFailedDays() {
  return await db.select()
    .from(dayTable)
    .where(eq(dayTable.isFailed, 1));
}

export async function addFailedDay(dayId: string) {
  await db.update(dayTable).set({
    isFailed: 1,
    isFrozen: 0,
    isStreak: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function removeFailedDay(dayId: string) {
  await db.update(dayTable).set({
    isFailed: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function addStreakDay(dayId: string) {
  await db.update(dayTable).set({
    isStreak: 1,
    isFailed: 0,
    isFrozen: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function removeStreakDay(dayId: string) {
  await db.update(dayTable).set({
    isStreak: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function addFrozenDay(dayId: string) {
  await db.update(dayTable).set({
    isFrozen: 1,
    isFailed: 0,
    isStreak: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function removeFrozenDay(dayId: string) {
  await db.update(dayTable).set({
    isFrozen: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function addStreak(count: number) {
  await db.insert(streakTable).values({ id: 1, streak: count })
    .onConflictDoUpdate({
      target: streakTable.id,
      set: { streak: count }
    });
}

export async function getStreakInfo() {
  const streakResult = await db.select().from(streakTable).limit(1);
  const streak = streakResult[0]?.streak ?? 0;

  const days = await db.select().from(dayTable);

  const streakDays = days.filter(d => d.isStreak === 1).map(d => d.id);
  const frozenDays = days.filter(d => d.isFrozen === 1).map(d => d.id);
  const failedDays = days.filter(d => d.isFailed === 1).map(d => d.id);

  return {
    streak,
    streakDays,
    frozenDays,
    failedDays,
  };
}

export async function clearStreakTable() {
  await db.delete(streakTable).run();
}