using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;

namespace SchedulingMeruap.Api.Repositories;

public class ActivityLogRepository : IActivityLogRepository
{
    private readonly ApplicationDbContext _context;

    public ActivityLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddRangeAsync(List<ActivityLog> logs)
    {
        _context.ActivityLogs.AddRange(logs);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ActivityLog>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId)
    {
        var query = _context.ActivityLogs.AsQueryable();

        if (startDate.HasValue) query = query.Where(l => l.Timestamp >= startDate.Value);
        if (endDate.HasValue) query = query.Where(l => l.Timestamp <= endDate.Value);
        if (!string.IsNullOrEmpty(staffId)) query = query.Where(l => l.SubjectStaffId == staffId);
        if (!string.IsNullOrEmpty(teamId)) query = query.Where(l => l.SubjectTeamId == teamId);

        return await query.OrderByDescending(l => l.Timestamp).ToListAsync();
    }
}