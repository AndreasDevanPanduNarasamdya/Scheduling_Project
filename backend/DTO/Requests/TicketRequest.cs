namespace SchedulingMeruap.Api.DTO.Requests;

using SchedulingMeruap.Api.Models;

public class SubmitTicketRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TicketType Type { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
}

public class TicketActionRequest
{
    public string Reason { get; set; } = null!;
}