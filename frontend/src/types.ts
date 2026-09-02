export type TicketStatus = "Pending" | "Approved" | "Declined";
export type TicketType = "On" | "Off";
export type BarType = "None" | "OffDuty" | "Leave" | "Transition";
export type ScheduleVersionStatus = "Active" | "Historical" | "Future";
export type ActivityLogAction = 
  | "CreateStaff" 
  | "EditStaff" 
  | "RemoveStaff" 
  | "AccountActivation" 
  | "CreateTicket" 
  | "ApproveTicket" 
  | "DeclineTicket"
  | "CreateTeam"
  | "EditTeam"
  | "RemoveTeam"
  | "CreatePersonalSchedule"
  | "EditPersonalSchedule"
  | "RemovePersonalSchedule"
  | "CreateTeamSchedule"
  | "EditTeamSchedule"
  | "RemoveTeamSchedule"
  | "SwitchingTeamMembers";

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
  date: string;
  barType: BarType;
  label?: string;
  scheduleType?: string;
  schedulePattern?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  description?: string;
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
  endDate?: string | null;
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
  reason?: string;
}

export interface StaffMember {
  staffId: string;
  name: string;
  position: string;
  status: "ON" | "OFF" | "TRANSITION" | "LEAVE";
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

/* ================= ACTIVITY LOG / HISTORY ================= */

export type DutyStatus = "OnDuty" | "OffDuty";
export type LogSourceType = "TeamSchedule" | "PersonalSchedule" | "FromTicket";

export interface ActivityLogResponse {
  logId: string;
  date: string;
  time: string;
  actor: string;
  action: ActivityLogAction; 
  target?: string;
  type?: number;
  edit?: string;
  dateRange?: string;
  rotation?: string;
  description?: string;
}

export interface UpdateStaffPayload {
  firstName: string;
  lastName: string;
  sex: number;
  position: string;
  email: string;
  phone: string;
  dob: string;
  joinDate: string;
  clearance: number;
}

export const Clearance = {
  Staff: 0,
  Supervisor: 1,
  Admin: 2
} as const;

export type Clearance = typeof Clearance[keyof typeof Clearance];