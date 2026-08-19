using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public class ActivityLog
{
    public string LogId { get; set; } = null!;
    public DateTime Date { get; set; }
    public TimeSpan Time { get; set; }
    public string Actor { get; set; } = null!;
    public Action Action { get; set; }
    public string? DateRange { get; set; }
    public string? Rotation { get; set; }
    public string Target { get; set; } = null!; // REQUIRED
    public string? Description { get; set; }    // REQUIRED (allowed null for now)
}