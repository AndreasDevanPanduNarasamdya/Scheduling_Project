using System;
using System.Collections.Generic;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Models;

public partial class NewHire
{
    public required string NewHireId { get; set; }
    public string ActivationToken { get; set; } = null!;
    public DateTime TokenExpiry { get; set; }
    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;

    public Sex Sex { get; set; }

    public string Position { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public DateTime JoinDate { get; set; }

    public DateTime Dob { get; set; }
}
