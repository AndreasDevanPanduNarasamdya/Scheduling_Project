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