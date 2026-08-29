namespace SchedulingMeruap.Api.Models;

public partial class Timeline
{
    public string TimelineId { get; set; } = null!;

    public string? TeamId { get; set; }
    public string? StaffId { get; set; }

    public DateTime StartDate { get; set; }
    public int DaysOn { get; set; }
    public int DaysOff { get; set; }
    public DateTime EndDate { get; set; }   // was DateTime? — Rule 7: mandatory

    public virtual Team? Team { get; set; }
    public virtual Staff? Staff { get; set; }
}