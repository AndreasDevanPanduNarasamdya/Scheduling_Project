using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface ITeamRepository
{
    Task<List<Team>> GetAllTeamsWithStaffAsync();
}