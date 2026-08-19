export type Scope = "this" | "last" | "all";

export type Session = {
  id: string;
  reader: string;
  program: string;
  avatar: string;
  minutes: number;
  books: number;
  date: string;
  note?: string;
  createdAt: number;
};

export type NewSession = Omit<Session, "id" | "createdAt"> & { id?: string };

export type Row = {
  reader: string;
  program: string;
  avatar: string;
  minutes: number;
  books: number;
  sessions: number;
  days: number;
  points: number;
  streak: number;
  badges: string[];
};

export type Stats = {
  scope: Scope;
  minutes: number;
  books: number;
  readers: number;
  sessions: number;
  daily: { date: string; label: string; minutes: number }[];
  weekStart: string;
  goalMinutes: number;
};

export type ContactMessage = {
  id?: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt?: number;
  status?: "new" | "read" | "replied";
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { message: string; status: number; fields?: Record<string, string> };
  requestId?: string;
  at?: string;
};

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  requestId?: string;
  constructor(
    message: string,
    status = 0,
    fields?: Record<string, string>,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.requestId = requestId;
  }
}

export type ConnectionState = "connecting" | "online" | "offline";

export const PROGRAMS = [
  "Registered General Nursing",
  "Registered Midwifery",
  "Registered Mental Health Nursing",
  "Registered Community Nursing",
  "Post-Basic / Faculty",
];

export const AVATARS = ["👩🏾‍⚕️", "🧑🏾‍⚕️", "👨🏾‍⚕️", "👩🏾‍🎓", "🧑🏾‍🎓", "👨🏾‍🎓", "👩🏾‍🏫", "🧑🏾‍💻"];
export const WEEKLY_GOAL_MINUTES = 600;
