using System;
using System.Collections.Generic;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Models;

public partial class Staff
{
    public string StaffId { get; set; } = null!;

    public string? UserId { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public Sex Sex { get; set; }

    public string Position { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public DateTime JoinDate { get; set; }

    public DateTime Dob { get; set; }

    public virtual ICollection<StaffTeam> StaffTeams { get; set; } = new List<StaffTeam>();

    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();

    public virtual User? User { get; set; }
}
