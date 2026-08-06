using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.DTO.Responses
{
    public class TeamMemberResponse
    {
        public string StaffId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Position { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
    }

    public class TeamResponse
    {
        public string TeamId { get; set; } = null!;
        public string TeamName { get; set; } = null!;
        public List<TeamMemberResponse> Members { get; set; } = new();
    }
}