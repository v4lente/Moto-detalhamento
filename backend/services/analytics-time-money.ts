const TIME_ZONE = "America/Sao_Paulo" as const;

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

export { TIME_ZONE };

export function zonedParts(value: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(value).map((part) => [part.type, part.value]));
  const weekday = ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[parts.weekday];
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    weekday,
  };
}

export function zonedDayStart(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  let candidate = new Date(Date.UTC(year, month - 1, day));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = zonedParts(candidate);
    const [localYear, localMonth, localDay] = local.date.split("-").map(Number);
    const observedAsUtc = Date.UTC(localYear, localMonth - 1, localDay, local.hour);
    const expectedAsUtc = Date.UTC(year, month - 1, day);
    candidate = new Date(candidate.valueOf() + expectedAsUtc - observedAsUtc);
  }
  return candidate;
}

export function nextCivilDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let current = from; current <= to; current = nextCivilDate(current)) dates.push(current);
  return dates;
}

export function decimalToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = typeof value === "number" ? value.toFixed(2) : String(value).trim();
  const match = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return Math.round(Number(value) * 100) || 0;
  const cents = Number(match[2]) * 100 + Number((match[3] || "").padEnd(2, "0"));
  return match[1] ? -cents : cents;
}
