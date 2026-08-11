using System;
using System.ComponentModel.DataAnnotations;

namespace SchedulingMeruap.Api.DTO.Requests
{
    public class TimelineRequest
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }
    public class CreateTimelineRequest
    {
        public string? TeamId { get; set; }
        public string? StaffId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public int DaysOn { get; set; }

        [Required]
        public int DaysOff { get; set; }
    }
}