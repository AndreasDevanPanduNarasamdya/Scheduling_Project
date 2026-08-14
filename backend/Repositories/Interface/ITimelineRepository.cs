using SchedulingMeruap.Api.Models;


namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface ITimelineRepository
{
    Task<List<Team>> GetTeamsWithStaffAndTicketsAsync();
    Task<List<Timeline>> GetActiveTimelinesAsync(DateTime startDate, DateTime endDate);
    Task<List<Timeline>> GetAllTimelinesAsync();
    Task<List<Timeline>> GetTimelinesByTargetAsync(string? teamId, string? staffId);
    Task<Timeline> CreateTimelineAsync(Timeline timeline);
    Task UpdateTimelineAsync(Timeline timeline);
    Task<bool> TeamExistsAsync(string teamId);
    Task<bool> StaffExistsAsync(string staffId);
}