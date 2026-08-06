using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITeamService
{
    Task<List<TeamResponse>> GetTeamsForManagementAsync();
}