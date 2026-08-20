using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITeamService
{
    Task<List<TeamResponse>> GetTeamsForManagementAsync();
    Task<TeamResponse> CreateTeamAsync(TeamRequest dto, string? actorStaffId);
    Task DeleteTeamAsync(string teamId, string? actorStaffId);
    Task UpdateTeamAsync(string teamId, string newTeamName, string? actorStaffId);
}