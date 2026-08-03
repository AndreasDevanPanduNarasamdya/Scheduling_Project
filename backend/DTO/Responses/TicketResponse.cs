namespace SchedulingMeruap.Api.DTO.Responses;

using SchedulingMeruap.Api.Models;

public class SubmitTicketRequest
{
    public DateTime Date { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Document { get; set; } = null!;
}