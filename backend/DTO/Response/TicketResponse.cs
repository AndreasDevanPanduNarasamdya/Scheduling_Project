namespace Program_Scheduling_Meruap.DTO.Response.FormResponse;

using Program_Scheduling_Meruap.Models.Enums;

public class TicketResponse
{
    public required string First_Name { get; set; }
    public required string Last_Name { get; set; }
    public required string Position { get; set; }
    public required string Team_ID { get; set; }
    public required TicketType Type { get; set; }
    public required TicketStatus Status { get; set; }
    public required DateTime[] Date { get; set; } = new DateTime[2];
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Document { get; set; }
}