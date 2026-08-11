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
    }
}