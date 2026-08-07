import test from "node:test";
import assert from "node:assert/strict";
import { filterByGrades, isVisibleForGrades } from "../app/lib/filtering";
import type { GradeTag } from "../app/types/content";

const tagged = (...gradeTags: GradeTag[]) => ({ gradeTags });

test("all-school content remains visible for any selected grade", () => {
  assert.equal(isVisibleForGrades(tagged("all-school"), ["grade-3"]), true);
  assert.equal(isVisibleForGrades(tagged("all-school"), ["preschool", "grade-8"]), true);
});

test("an empty selection shows every grade", () => {
  assert.equal(isVisibleForGrades(tagged("grade-3"), []), true);
  assert.equal(isVisibleForGrades(tagged("preschool"), []), true);
});

test("content is visible when any selected grade matches", () => {
  assert.equal(isVisibleForGrades(tagged("grade-2", "grade-3"), ["grade-3", "grade-6"]), true);
});

test("content is hidden when no selected grade matches", () => {
  assert.equal(isVisibleForGrades(tagged("preschool"), ["kindergarten", "grade-3"]), false);
});

test("filterByGrades keeps all-school and matching records", () => {
  const items = [
    { id: "all", gradeTags: ["all-school"] as GradeTag[] },
    { id: "three", gradeTags: ["grade-3"] as GradeTag[] },
    { id: "five", gradeTags: ["grade-5"] as GradeTag[] },
  ];
  assert.deepEqual(filterByGrades(items, ["grade-3"]).map((item) => item.id), ["all", "three"]);
});
