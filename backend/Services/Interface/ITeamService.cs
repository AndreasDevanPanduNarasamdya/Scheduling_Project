using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITeamService
{
    Task<List<TeamResponse>> GetTeamsForManagementAsync();
    Task<TeamResponse> CreateTeamAsync(TeamRequest dto);
    Task DeleteTeamAsync(string teamId);
}