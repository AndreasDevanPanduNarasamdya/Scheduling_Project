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
    private readonly IActivityLogService _activityLogService;

    public TeamService(ITeamRepository repository, IActivityLogService activityLogService)
    {
        _repository = repository;
        _activityLogService = activityLogService;
    }

    public async Task<List<TeamResponse>> GetTeamsForManagementAsync()
    {
        var teams = await _repository.GetAllTeamsWithStaffAsync();

        // Grab today's date once so we don't calculate it hundreds of times in the loop
        var today = DateTime.Today;

        return teams.Select(t => new TeamResponse
        {
            TeamId = t.TeamId,
            TeamName = t.TeamName,
            Members = t.StaffTeams.Select(st =>
            {
                var staff = st.Staff;

                // 1. Look for an Approved ticket that overlaps with TODAY
                // (Using ?. just in case Tickets is null)
                var activeTicket = staff.Tickets?.FirstOrDefault(tick =>
                    tick.Status == TicketStatus.Approved &&
                    today >= tick.StartDate.Date &&
                    today <= tick.EndDate.Date);

                // 2. Default state (Change this later if you want to check a Schedule table!)
                string computedStatus = "ON";
                string computedNote = "On shift";

                // 3. The Override Logic
                if (activeTicket != null)
                {
                    // Ticket exists! Override the status and pull the description
                    computedStatus = activeTicket.Type == TicketType.On ? "ON" : "OFF";
                    computedNote = activeTicket.Description;
                }

                return new TeamMemberResponse
                {
                    StaffId = staff.StaffId,
                    Name = $"{staff.FirstName} {staff.LastName}".Trim(),
                    Position = staff.Position,
                    Status = computedStatus,
                    Note = computedNote
                };
            }).ToList()
        }).ToList();
    }

    public async Task<TeamResponse> CreateTeamAsync(TeamRequest dto, string? actorStaffId)
    {
        Team newTeam = new()
        {
            TeamId = Guid.NewGuid().ToString(),
            TeamName = dto.TeamName,
            Created = DateTime.UtcNow
        };

        await _repository.AddTeamAsync(newTeam);
        await _activityLogService.LogTeamCreatedAsync(newTeam, actorStaffId);

        return new()
        {
            TeamId = newTeam.TeamId,
            TeamName = newTeam.TeamName,
            // 🔥 OPTIMIZATION: Zero-allocation empty list
            Members = []
        };
    }

    public async Task DeleteTeamAsync(string teamId, string? actorStaffId)
    {
        // 🔥 OPTIMIZATION: Catch blank spaces, not just nulls
        if (string.IsNullOrWhiteSpace(teamId))
            throw new ArgumentException("Team ID is required.");

        var team = await _repository.GetByIdAsync(teamId);
        if (team is null) return;

        string teamName = team.TeamName;

        await _repository.DeleteTeamAsync(teamId);
        await _activityLogService.LogTeamDeletedAsync(teamName, actorStaffId);
    }

    public async Task UpdateTeamAsync(string teamId, string newTeamName, string? actorStaffId)
    {
        var team = await _repository.GetByIdAsync(teamId);
        if (team is null)
            throw new ArgumentException("Team not found.");

        string oldName = team.TeamName;
        team.TeamName = newTeamName;

        await _repository.UpdateTeamAsync(team);

        string summary = $"Mengubah nama tim dari {oldName} menjadi {newTeamName}";
        await _activityLogService.LogTeamEditedAsync(oldName, team, actorStaffId, summary);
    }
}