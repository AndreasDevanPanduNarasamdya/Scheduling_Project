using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class StaffTeam
{
    public string StaffTeamId { get; set; } = null!;

    public string TeamId { get; set; } = null!;

    public string StaffId { get; set; } = null!;

    public virtual Staff Staff { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;
}
