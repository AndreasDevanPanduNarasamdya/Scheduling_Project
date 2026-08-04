namespace SchedulingMeruap.Api.DTO.Responses;

using SchedulingMeruap.Api.Models;

public class SubmitTicketRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public byte Type { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    // public string Document { get; set; } = null!;
}