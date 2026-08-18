using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.DTO.Responses;

public class ActivityLogResponse
{
    public string LogId { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string ActionType { get; set; } = null!;
    public string? ActorName { get; set; }
    public string? StaffName { get; set; }
    public string? Position { get; set; }
    public string? TeamName { get; set; }
    public string Description { get; set; } = null!;
}