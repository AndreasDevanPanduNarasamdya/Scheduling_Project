using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class ActivityLog
{
    public string LogId { get; set; } = null!;

    public string ScheduleId { get; set; } = null!;

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Position { get; set; } = null!;

    public string Team { get; set; } = null!;

    public string Type { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Document { get; set; } = null!;

    public virtual Schedule Schedule { get; set; } = null!;
}
