export type TicketStatus = "Pending" | "Approved" | "Declined";
export type TicketType = "On" | "Off";
export type BarType = "None" | "OffDuty" | "Leave" | "Transition";
export type ScheduleVersionStatus = "Active" | "Historical" | "Future";

export interface EndTimelinePayload {
  teamId: string | null;
  staffId: string | null;
  effectiveEndDate: string; // YYYY-MM-DD
}

export interface TimelineHistoryRecord {
  timelineId: string;
  teamId?: string | null;
  staffId?: string | null;
  startDate: string;
  endDate?: string | null;
  daysOn: number;
  daysOff: number;
  status: ScheduleVersionStatus;
}

export interface TimelineDay {
  date: string;       // ISO date string, e.g. "2026-07-24"
  barType: BarType;
  label?: string;
}

export interface TimelineStaff {
  staffId: string;
  name: string;
  position: string;
  days: TimelineDay[];
}

export interface TimelineTeam {
  teamId: string;
  teamName: string;
  members: TimelineStaff[];
}

export interface CreateTimelinePayload {
  teamId: string | null;
  staffId: string | null;
  startDate: string;
  daysOn: number;
  daysOff: number;
}

export interface Ticket {
  ticketID: string;
  firstName: string;
  lastName: string;
  role: string;
  team: string;
  type: TicketType;
  title: string;
  description: string;
  startDate: string;
  EndDate: string;
  dateRange?: string;
  status: TicketStatus;
}

export interface StaffMember {
  staffId: string;
  name: string;
  position: string;
  status: "ON" | "OFF";
  note?: string | null;
}

export interface Team {
  teamId: string;
  teamName: string;
  members: StaffMember[];
}

export type TokenValidationResult = {
  status: "valid" | "expired" | "used" | "invalid";
};