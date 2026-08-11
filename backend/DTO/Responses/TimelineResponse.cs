using System.Collections.Generic;

namespace SchedulingMeruap.Api.DTO.Responses
{
    public class TimelineTeamResponse
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public List<TimelineStaffResponse> Members { get; set; } = new List<TimelineStaffResponse>();
    }

    public class TimelineStaffResponse
    {
        public string StaffId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public List<TimelineDayResponse> Days { get; set; } = new List<TimelineDayResponse>();
    }

    public class TimelineDayResponse
    {
        public string Date { get; set; } = string.Empty;
        public string BarType { get; set; } = string.Empty;
        public string? Label { get; set; }
    }

    public class TimelineHistoryResponse
    {
        public string TimelineId { get; set; } = string.Empty;
        public string? TeamId { get; set; }
        public string? StaffId { get; set; }
        public string StartDate { get; set; } = string.Empty;
        public string? EndDate { get; set; }
        public int DaysOn { get; set; }
        public int DaysOff { get; set; }
        public string Status { get; set; } = string.Empty; // "Active", "Historical", or "Future"
    }
}