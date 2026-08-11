using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;


namespace SchedulingMeruap.Api.Repositories;

public class TimelineRepository : ITimelineRepository
{
    private readonly ApplicationDbContext _context;

    public TimelineRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Team>> GetTeamsWithStaffAndTicketsAsync()
    {
        return await _context.Teams
            .Include(t => t.StaffTeams)
                .ThenInclude(st => st.Staff)
                    .ThenInclude(s => s.Tickets)
            .ToListAsync();
    }

    public async Task<List<Timeline>> GetActiveTimelinesAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.Timelines
            .Where(t => t.StartDate <= endDate && (!t.EndDate.HasValue || t.EndDate >= startDate))
            .ToListAsync();
    }

    public async Task<List<Timeline>> GetAllTimelinesAsync()
    {
        return await _context.Timelines.ToListAsync();
    }

    public async Task<List<Timeline>> GetTimelinesByTargetAsync(string? teamId, string? staffId)
    {
        return await _context.Timelines
            .Where(t => (teamId != null && t.TeamId == teamId) || (staffId != null && t.StaffId == staffId))
            .OrderBy(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<Timeline> CreateTimelineAsync(Timeline timeline)
    {
        _context.Timelines.Add(timeline);
        await _context.SaveChangesAsync();
        return timeline;
    }

    public async Task UpdateTimelineAsync(Timeline timeline)
    {
        _context.Timelines.Update(timeline);
        await _context.SaveChangesAsync();
    }

    public async Task SetFollowsTeamScheduleAsync(string staffId, bool followsTeam)
    {
        var staffTeams = await _context.StaffTeams.Where(st => st.StaffId == staffId).ToListAsync();
        foreach (var st in staffTeams)
        {
            st.FollowsTeamSchedule = followsTeam;
        }
        await _context.SaveChangesAsync();
    }

    public async Task<bool> TeamExistsAsync(string teamId)
    {
        return await _context.Teams.AnyAsync(t => t.TeamId == teamId);
    }

    public async Task<bool> StaffExistsAsync(string staffId)
    {
        return await _context.Staff.AnyAsync(s => s.StaffId == staffId);
    }
}