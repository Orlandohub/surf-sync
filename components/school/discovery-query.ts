/**
 * The Instrutores URL: /school/discovery?location=…&experience=…&day=…&view=saved
 * (the filter keys are the ones the page has always used). Shared by the
 * server page and the client filters, so it has no "use client".
 */
export type DiscoveryQuery = {
  location?: string;
  experience?: string;
  day?: string;
  view?: "saved";
};

export function discoveryHref(q: DiscoveryQuery): string {
  const params = new URLSearchParams();
  if (q.location) params.set("location", q.location);
  if (q.experience) params.set("experience", q.experience);
  if (q.day) params.set("day", q.day);
  if (q.view === "saved") params.set("view", "saved");
  const s = params.toString();
  return s ? `/school/discovery?${s}` : "/school/discovery";
}

export function hasFilters(q: DiscoveryQuery): boolean {
  return Boolean(q.location || q.experience || q.day);
}
