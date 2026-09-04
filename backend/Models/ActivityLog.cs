using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public class ActivityLog
{
    public string LogId { get; set; } = null!;
    public DateOnly Date { get; set; }
    public TimeSpan Time { get; set; }
    public string Actor { get; set; } = null!;
    public Action Action { get; set; }
    public string Target { get; set; } = null!;
    public TicketType? Type { get; set; }
    public string? Edit { get; set; }
    public DateOnly? RangeStart { get; set; }
    public DateOnly? RangeEnd { get; set; }
    public string? Rotation { get; set; }
    public string? Description { get; set; }
}