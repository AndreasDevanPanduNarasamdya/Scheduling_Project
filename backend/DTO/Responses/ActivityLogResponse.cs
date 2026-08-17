using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.DTO.Responses;

public class ActivityLogResponse
{
    public string LogId { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string? StaffName { get; set; }
    public string? Position { get; set; }
    public string? TeamName { get; set; }
    public string DutyStatus { get; set; } = null!;
    public string? Reason { get; set; }
    public string? Description { get; set; }
    public string SourceType { get; set; } = null!;
    public string? SourceDetail { get; set; }
}