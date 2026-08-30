using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.DTO.Responses;

public class TicketResponse
{
    public string TicketID { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Team { get; set; } = null!;
    public TicketType Type { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TicketStatus Status { get; set; }
    public string? Reason { get; set; }
}