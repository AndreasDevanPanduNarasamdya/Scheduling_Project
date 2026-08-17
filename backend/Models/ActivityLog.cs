using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class ActivityLog
{
    public string LogId { get; set; } = null!;
    public DateTime Timestamp { get; set; }

    public string? SubjectStaffId { get; set; }
    public string? SubjectTeamId { get; set; }

    public string? SnapshotName { get; set; }
    public string? SnapshotPosition { get; set; }
    public string? SnapshotTeamName { get; set; }

    public string DutyStatus { get; set; } = null!;
    public string? Reason { get; set; }
    public string? Description { get; set; }

    public string SourceType { get; set; } = null!;
    public string? SourceDetail { get; set; }

    public string? ActionType { get; set; }
    public string? ActorStaffId { get; set; }
}