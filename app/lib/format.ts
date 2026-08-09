import type { GradeTag } from "../types/content";

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    ...(options ?? { month: "short", day: "numeric", year: "numeric" }),
    timeZone: "America/Detroit",
  }).format(new Date(value));
}

export function formatTime(value?: string) {
  if (!value) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Detroit",
  }).format(new Date(value));
}

export function formatGradeLabel(grade: GradeTag): string {
  if (grade === "all-school") return "All school";
  if (grade === "preschool") return "Preschool";
  if (grade === "kindergarten") return "Kindergarten";
  return `Grade ${grade.replace("grade-", "")}`;
}
