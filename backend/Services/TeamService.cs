using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.DTO.Requests;
using Action = SchedulingMeruap.Api.Models.Action;

namespace SchedulingMeruap.Api.Services;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _repository;
    private readonly IActivityLogService _activityLogService; // 🔥 Swapped to Service!

    public TeamService(ITeamRepository repository, IActivityLogService activityLogService)
    {
        _repository = repository;
        _activityLogService = activityLogService;
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

    public async Task<TeamResponse> CreateTeamAsync(TeamRequest dto, string? actorStaffId)
    {
        var newTeam = new Team
        {
            TeamId = Guid.NewGuid().ToString(),
            TeamName = dto.TeamName,
            Created = DateTime.UtcNow
        };

        await _repository.AddTeamAsync(newTeam);

        // 🔥 Call your new centralized log method!
        await _activityLogService.LogTeamCreatedAsync(newTeam, actorStaffId);

        return new TeamResponse
        {
            TeamId = newTeam.TeamId,
            TeamName = newTeam.TeamName,
            Members = new List<TeamMemberResponse>()
        };
    }

    public async Task DeleteTeamAsync(string teamId, string? actorStaffId)
    {
        if (string.IsNullOrEmpty(teamId))
            throw new ArgumentException("Team ID is required.");

        var team = await _repository.GetByIdAsync(teamId);
        if (team == null) return;

        string teamName = team.TeamName;

        await _repository.DeleteTeamAsync(teamId);

        // 🔥 Call your new centralized log method!
        await _activityLogService.LogTeamDeletedAsync(teamName, actorStaffId);
    }

    public async Task UpdateTeamAsync(string teamId, string newTeamName, string? actorStaffId)
    {
        var team = await _repository.GetByIdAsync(teamId);
        if (team == null)
        {
            throw new ArgumentException("Team not found.");
        }

        string oldName = team.TeamName;
        team.TeamName = newTeamName;

        await _repository.UpdateTeamAsync(team);

        // 🔥 Call your new centralized log method!
        string summary = $"Mengubah nama tim dari {oldName} menjadi {newTeamName}";
        await _activityLogService.LogTeamEditedAsync(oldName, team, actorStaffId, summary);
    }
}