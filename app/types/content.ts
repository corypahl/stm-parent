export const gradeOptions = [
  { value: "preschool", label: "Preschool", shortLabel: "Pre-K" },
  { value: "kindergarten", label: "Kindergarten", shortLabel: "K" },
  { value: "grade-1", label: "Grade 1", shortLabel: "1" },
  { value: "grade-2", label: "Grade 2", shortLabel: "2" },
  { value: "grade-3", label: "Grade 3", shortLabel: "3" },
  { value: "grade-4", label: "Grade 4", shortLabel: "4" },
  { value: "grade-5", label: "Grade 5", shortLabel: "5" },
  { value: "grade-6", label: "Grade 6", shortLabel: "6" },
  { value: "grade-7", label: "Grade 7", shortLabel: "7" },
  { value: "grade-8", label: "Grade 8", shortLabel: "8" },
] as const;

export type ConfiguredGradeTag = (typeof gradeOptions)[number]["value"];
export type GradeTag = "all-school" | ConfiguredGradeTag;

export type ContentType =
  | "announcement"
  | "event"
  | "deadline"
  | "action"
  | "volunteer"
  | "signup"
  | "lunch"
  | "document"
  | "form"
  | "calendar"
  | "policy"
  | "other";

export type ContentItem = {
  id: string;
  title: string;
  summary?: string;
  body?: string;
  contentType: ContentType;
  gradeTags: GradeTag[];
  categoryTags: string[];
  startAt?: string;
  endAt?: string;
  deadlineAt?: string;
  location?: string;
  actionUrl?: string;
  actionLabel?: string;
  sourceUrl: string;
  sourceLabel: string;
  sourceNewsletterId?: string;
  status: "draft" | "review" | "published" | "archived" | "closed";
  actionStatus?: "open" | "closing_soon" | "due_today" | "closed" | "unknown";
  extractionConfidence?: number;
  needsReview: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type SchoolDocument = {
  id: string;
  title: string;
  description?: string;
  category: string;
  sourceUrl: string;
  gradeTags: GradeTag[];
  schoolYear?: string;
  effectiveDate?: string;
  fileType: string;
  active: boolean;
  lastVerifiedAt?: string;
};

export type LunchDay = {
  date: string;
  mainEntree: string;
  alternateEntree?: string;
  sides: string[];
  notes?: string;
  gradeTags: GradeTag[];
  sourceUrl: string;
  isDemo: boolean;
};

export type HandbookSection = {
  id: string;
  title: string;
  excerpt: string;
  keywords: string[];
  page?: number;
  sourceUrl: string;
  isDemo: boolean;
};

export type NewsletterSummary = {
  id: string;
  title: string;
  newsletterDate: string;
  sourceUrl: string;
  itemCount: number;
  grades: GradeTag[];
  status: "published" | "archived";
  isDemo: boolean;
};
