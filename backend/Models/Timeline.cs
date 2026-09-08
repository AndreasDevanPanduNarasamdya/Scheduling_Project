namespace SchedulingMeruap.Api.Models;

public partial class Timeline
{
    public string TimelineId { get; set; } = null!;

    public string? TeamId { get; set; }
    public string? StaffId { get; set; }

    public DateTime StartDate { get; set; }
    public int DaysOn { get; set; }
    public int DaysOff { get; set; }
    public DateTime EndDate { get; set; }

    public virtual Team? Team { get; set; }
    public virtual Staff? Staff { get; set; }
    public string? ColorTheme { get; set; }
}