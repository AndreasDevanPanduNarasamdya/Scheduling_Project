using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories.Interfaces;

namespace SchedulingMeruap.Api.Services;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _repository;

    public TeamService(ITeamRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<TeamResponse>> GetTeamsForManagementAsync()
    {
        var teams = await _repository.GetAllTeamsWithStaffAsync();

        // The Service does the "smart" work: combining names, mapping to DTOs
        return teams.Select(t => new TeamResponse
        {
            TeamId = t.TeamId,
            TeamName = t.TeamName,
            Members = t.StaffTeams.Select(st => new TeamMemberResponse
            {
                StaffId = st.Staff.StaffId,
                Name = $"{st.Staff.FirstName} {st.Staff.LastName}",
                Position = st.Staff.Position,
                Status = "ON",
                Note = null
            }).ToList()
        }).ToList();
    }
}