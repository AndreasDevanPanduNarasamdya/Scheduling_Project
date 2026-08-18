using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class ActivityLog
{
    public string LogId { get; set; } = null!;
    public DateTime Timestamp { get; set; }

    public string ActionType { get; set; } = null!;   // "CreateSchedule", "ChangeSchedule", "DeleteSchedule", "CreateTicket"

    public string? ActorStaffId { get; set; }          // who performed it (nullable if system/unknown)
    public string? SubjectStaffId { get; set; }
    public string? SubjectTeamId { get; set; }

    public string? SnapshotName { get; set; }
    public string? SnapshotPosition { get; set; }
    public string? SnapshotTeamName { get; set; }

    public string Description { get; set; } = null!;   // human-readable summary, e.g. "Created 4-on/2-off rotation for Tim A"
}