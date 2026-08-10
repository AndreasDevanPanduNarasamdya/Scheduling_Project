using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class User
{
    public string UserId { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public DateTime Created { get; set; }

    public bool Locked { get; set; }

    public virtual ICollection<Staff> Staff { get; set; } = new List<Staff>();
}
