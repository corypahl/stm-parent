"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { gradeOptions, type GradeTag } from "../types/content";

const STORAGE_KEY = "stm-parent:selected-grades:v1";
const validGrades = new Set<string>(gradeOptions.map((grade) => grade.value));

type GradeFilterContextValue = {
  selectedGrades: GradeTag[];
  toggleGrade: (grade: GradeTag) => void;
  clearGrades: () => void;
};

const GradeFilterContext = createContext<GradeFilterContextValue | null>(null);

function subscribeToGradePreference(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("stm-grades-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("stm-grades-changed", callback);
  };
}

function getGradePreferenceSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function parseGradePreference(serialized: string): GradeTag[] {
  try {
    const stored: unknown = JSON.parse(serialized);
    return Array.isArray(stored)
      ? stored.filter((value): value is GradeTag => typeof value === "string" && validGrades.has(value))
      : [];
  } catch {
    return [];
  }
}

function writeGradePreference(grades: GradeTag[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
  window.dispatchEvent(new Event("stm-grades-changed"));
}

export function GradeFilterProvider({ children }: { children: ReactNode }) {
  const serialized = useSyncExternalStore(
    subscribeToGradePreference,
    getGradePreferenceSnapshot,
    () => "[]",
  );
  const selectedGrades = useMemo(() => parseGradePreference(serialized), [serialized]);

  const value = useMemo<GradeFilterContextValue>(
    () => ({
      selectedGrades,
      toggleGrade: (grade) =>
        writeGradePreference(
          selectedGrades.includes(grade)
            ? selectedGrades.filter((value) => value !== grade)
            : [...selectedGrades, grade],
        ),
      clearGrades: () => writeGradePreference([]),
    }),
    [selectedGrades],
  );

  return (
    <GradeFilterContext.Provider value={value}>
      {children}
    </GradeFilterContext.Provider>
  );
}

export function useGradeFilter() {
  const value = useContext(GradeFilterContext);
  if (!value) throw new Error("useGradeFilter must be used inside its provider");
  return value;
}
