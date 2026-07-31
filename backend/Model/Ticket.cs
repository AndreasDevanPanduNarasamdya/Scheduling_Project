namespace Program_Scheduling_Meruap.Models.Ticket;

using Program_Scheduling_Meruap.Models.Enums;

public class Ticket
{
    public required string Ticket_ID { get; set; }
    public required string Staff_ID { get; set; }
    public required DateTime Date { get; set; }
    public required TicketType Type { get; set; }
    public required TicketStatus Status { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Document { get; set; }
    public string? Reason { get; set; }
}