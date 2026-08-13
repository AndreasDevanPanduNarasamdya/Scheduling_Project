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

        public DateTime? EndDate { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "DaysOn must be greater than or equal to 1.")]
        public int DaysOn { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "DaysOff must be greater than or equal to 1.")]
        public int DaysOff { get; set; }
    }

    public class EndTimelineRequest
    {
        public string? TeamId { get; set; }
        public string? StaffId { get; set; }

        [Required]
        public DateTime EffectiveEndDate { get; set; }
    }
}