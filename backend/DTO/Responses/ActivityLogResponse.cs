using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SchedulingMeruap.Api.Models;
using Action = SchedulingMeruap.Api.Models.Action;

namespace SchedulingMeruap.Api.DTO.Responses;

public class ActivityLogResponse
{
    public string LogId { get; set; } = null!;
    public DateTime Date { get; set; }
    public TimeSpan Time { get; set; }
    public string Actor { get; set; } = null!;
    public Action Action { get; set; }
    public string? DateRange { get; set; }
    public string? Rotation { get; set; }
    public string Target { get; set; } = null!;
    public string? Description { get; set; }
}