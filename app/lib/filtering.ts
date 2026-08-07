import type { GradeTag } from "../types/content";

export type GradeTagged = { gradeTags: GradeTag[] };

export function isVisibleForGrades(
  item: GradeTagged,
  selectedGrades: readonly GradeTag[],
): boolean {
  if (item.gradeTags.includes("all-school")) return true;
  if (selectedGrades.length === 0) return true;
  return selectedGrades.some((grade) => item.gradeTags.includes(grade));
}

export function filterByGrades<T extends GradeTagged>(
  items: readonly T[],
  selectedGrades: readonly GradeTag[],
): T[] {
  return items.filter((item) => isVisibleForGrades(item, selectedGrades));
}

export function formatGradeLabel(grade: GradeTag): string {
  if (grade === "all-school") return "All school";
  if (grade === "preschool") return "Preschool";
  if (grade === "kindergarten") return "Kindergarten";
  return `Grade ${grade.replace("grade-", "")}`;
}
