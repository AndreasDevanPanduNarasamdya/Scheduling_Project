export type TicketStatus = 0 | 1 | 2;
export type TicketType = 'ON' | 'OFF' | 0 | 1;
export type BarType = "None" | "OffDuty" | "Leave" | "Transition";

export interface TimelineDay {
  date: string;       // ISO date string, e.g. "2026-07-24"
  barType: BarType;
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