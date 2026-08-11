using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class Team
{
    public string TeamId { get; set; } = null!;

    public string TeamName { get; set; } = null!;

    public DateTime Created { get; set; }

    // public virtual ICollection<Shift> Shifts { get; set; } = new List<Shift>();

    public virtual ICollection<StaffTeam> StaffTeams { get; set; } = new List<StaffTeam>();
}
