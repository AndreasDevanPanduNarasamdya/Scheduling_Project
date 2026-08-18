using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface IActivityLogRepository
{
    Task AddAsync(ActivityLog log);
    Task<List<ActivityLog>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId);
}