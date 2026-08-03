using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class Schedule
{
    public string ScheduleId { get; set; } = null!;

    public DateTime Date { get; set; }

    public virtual ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();

    public virtual ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}
