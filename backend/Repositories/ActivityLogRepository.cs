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

    public async Task AddAsync(ActivityLog log)
    {
        _context.ActivityLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ActivityLog>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId)
    {
        var query = _context.ActivityLogs.AsQueryable();

        // 1. Filter strictly by the new Date column
        if (startDate.HasValue)
            query = query.Where(l => l.Date >= startDate.Value.Date);

        if (endDate.HasValue)
            query = query.Where(l => l.Date <= endDate.Value.Date);

        // 2. Filter by Target Name (since we dropped the UUID columns)
        if (!string.IsNullOrEmpty(staffId))
        {
            var staff = await _context.Set<Staff>().FindAsync(staffId);
            if (staff != null)
            {
                var staffName = $"{staff.FirstName} {staff.LastName}".Trim();
                query = query.Where(l => l.Target == staffName);
            }
        }

        if (!string.IsNullOrEmpty(teamId))
        {
            var team = await _context.Set<Team>().FindAsync(teamId);
            if (team != null)
            {
                var teamTargetName = $"Tim {team.TeamName}";
                query = query.Where(l => l.Target == teamTargetName);
            }
        }

        // 3. Order chronologically: Newest Date, then Newest Time
        return await query
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.Time)
            .ToListAsync();
    }
}