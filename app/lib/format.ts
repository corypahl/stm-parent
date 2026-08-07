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
