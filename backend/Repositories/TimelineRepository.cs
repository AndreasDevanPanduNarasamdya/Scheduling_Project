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
        // Fetches only the rotation patterns active during the requested date range
        return await _context.Timelines
            .Where(t => t.StartDate <= endDate && (!t.EndDate.HasValue || t.EndDate >= startDate))
            .ToListAsync();
    }

    public async Task<List<Timeline>> GetAllTimelinesAsync()
    {
        return await _context.Timelines.ToListAsync();
    }
    public async Task<Timeline> CreateTimelineAsync(Timeline timeline)
    {
        // Assuming your Entity Framework DbContext is called _context 
        // and the table is called Timelines
        _context.Timelines.Add(timeline);
        await _context.SaveChangesAsync();

        return timeline;
    }
}