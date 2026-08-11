using SchedulingMeruap.Api.Models;


namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface ITimelineRepository
{
    Task<List<Team>> GetTeamsWithStaffAndTicketsAsync();
    Task<List<Timeline>> GetActiveTimelinesAsync(DateTime startDate, DateTime endDate);
    Task<Timeline> CreateTimelineAsync(Timeline timeline);
}