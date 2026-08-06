using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories;

public class TeamRepository : ITeamRepository
{
    private readonly ApplicationDbContext _context;

    public TeamRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Team>> GetAllTeamsWithStaffAsync()
    {
        // Returns RAW database models. No DTOs here!
        return await _context.Teams
            .Include(t => t.StaffTeams)
                .ThenInclude(st => st.Staff)
            .ToListAsync();
    }
}