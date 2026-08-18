using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface ITeamRepository
{
    Task<List<Team>> GetAllTeamsWithStaffAsync();
    Task AddTeamAsync(Team team);
    Task DeleteTeamAsync(string teamId);
    Task<Team?> GetByIdAsync(string teamId);
}