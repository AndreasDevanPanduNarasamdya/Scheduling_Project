using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class Ticket
{
    public string TicketId { get; set; } = null!;

    public string? StaffId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public TicketType Type { get; set; }

    public TicketStatus Status { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? Reason { get; set; }

    public virtual Staff? Staff { get; set; }
}
