using System;
using System.Collections.Generic;

namespace SchedulingMeruap.Api.Models;

public partial class Ticket
{
    public string TicketId { get; set; } = null!;

    public string? StaffId { get; set; }

    public DateTime Date { get; set; }

    public string Type { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Document { get; set; } = null!;

    public string? Reason { get; set; }

    public virtual Staff? Staff { get; set; }
}
