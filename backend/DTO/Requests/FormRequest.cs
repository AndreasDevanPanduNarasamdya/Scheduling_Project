namespace SchedulingMeruap.Api.DTO.Requests;

using SchedulingMeruap.Api.Models;

public class FormRequest
{
    public required string First_Name { get; set; } = string.Empty;
    public required string Last_Name { get; set; } = string.Empty;
    public required string Position { get; set; } = string.Empty;
    public required string Team_ID { get; set; } = string.Empty;
    public required TicketType Type { get; set; }
    public required TicketStatus Status { get; set; }
    public required DateTime[] Date { get; set; } = new DateTime[2];
    public required string Title { get; set; } = string.Empty;
    public required string Description { get; set; } = string.Empty;
    public required string Document { get; set; } = string.Empty;
}