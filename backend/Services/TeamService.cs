using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.DTO.Requests;

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
    public async Task<TeamResponse> CreateTeamAsync(TeamRequest dto)
    {
        var newTeam = new Team
        {
            TeamId = Guid.NewGuid().ToString(),
            TeamName = dto.TeamName,
            Created = DateTime.UtcNow
        };

        await _repository.AddTeamAsync(newTeam);

        return new TeamResponse
        {
            TeamId = newTeam.TeamId,
            TeamName = newTeam.TeamName,
            Members = new List<TeamMemberResponse>() // Empty list for a brand new team
        };
    }
}