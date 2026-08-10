export type TicketStatus = 0 | 1 | 2;
export type TicketType = 'ON' | 'OFF' |0 | 1;;

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