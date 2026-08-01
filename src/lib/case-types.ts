export type CaseStatus = "touched" | "working" | "other" | "closed";

export interface CaseEntry {
  id: string;
  title: string;
  account: string;
  minutes: number;
  status: CaseStatus;
  notes: string;
  createdAt: string;
}

export interface PunchEntry {
  id: string;
  date: string; // YYYY-MM-DD
  punchIn: string; // HH:MM
  punchOut: string; // HH:MM or ""
  note: string;
}

export interface PtoEntry {
  id: string;
  date: string;
  hours: number;
  type: "PTO" | "Sick" | "Holiday" | "Other";
  note: string;
}

export interface DayHistory {
  date: string; // YYYY-MM-DD
  caseCount: number;
  totalMinutes: number;
  byStatus: { touched: number; working: number; other: number; closed: number };
  hoursWorked: number;
  ptoUsed: number;
  newCasesAdded?: number;
  cases: { title: string; account: string; minutes: number; status: CaseStatus; notes: string }[];
  updatedAt: string;
}

export const STATUS_META: Record<
  CaseStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  touched: {
    label: "Touched",
    bg: "bg-status-touched/15",
    text: "text-status-touched-foreground",
    dot: "bg-status-touched",
  },
  working: {
    label: "Working",
    bg: "bg-status-working/25",
    text: "text-status-working-foreground",
    dot: "bg-status-working",
  },
  other: {
    label: "Other",
    bg: "bg-status-other/20",
    text: "text-status-other-foreground",
    dot: "bg-status-other",
  },
  closed: {
    label: "Closed",
    bg: "bg-status-closed/20",
    text: "text-status-closed-foreground",
    dot: "bg-status-closed",
  },
};
