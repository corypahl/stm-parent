"use client";

import { gradeOptions } from "../types/content";
import { useGradeFilter } from "./GradeFilterProvider";

export function GradeFilter() {
  const { selectedGrades, toggleGrade, clearGrades } = useGradeFilter();
  const showingAll = selectedGrades.length === 0;

  return (
    <section className="grade-filter" aria-labelledby="grade-filter-title">
      <div className="grade-filter__heading">
        <div>
          <span className="eyebrow" id="grade-filter-title">
            Grade Filter
          </span>
          <p>
            {showingAll
              ? "Showing every grade"
              : `Showing ${selectedGrades.length} selected ${selectedGrades.length === 1 ? "grade" : "grades"}`}
          </p>
        </div>
        {!showingAll && (
          <button className="text-button" type="button" onClick={clearGrades}>
            Clear
          </button>
        )}
      </div>
      <div className="grade-filter__chips" aria-label="Filter content by grade">
        <button
          type="button"
          className={`grade-chip ${showingAll ? "grade-chip--selected" : ""}`}
          aria-pressed={showingAll}
          onClick={clearGrades}
        >
          All
        </button>
        {gradeOptions.map((grade) => {
          const selected = selectedGrades.includes(grade.value);
          return (
            <button
              type="button"
              key={grade.value}
              className={`grade-chip ${selected ? "grade-chip--selected" : ""}`}
              aria-pressed={selected}
              aria-label={grade.label}
              title={grade.label}
              onClick={() => toggleGrade(grade.value)}
            >
              {grade.shortLabel}
            </button>
          );
        })}
      </div>
      <p className="grade-filter__note">All-school notices are always included.</p>
    </section>
  );
}
