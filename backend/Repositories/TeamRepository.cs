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
    public async Task AddTeamAsync(Team team)
    {
        _context.Teams.Add(team);
        await _context.SaveChangesAsync();
    }
    public async Task DeleteTeamAsync(string teamId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return;

            var staffTeams = _context.StaffTeams.Where(st => st.TeamId == teamId);
            _context.StaffTeams.RemoveRange(staffTeams);

            var teamTimelines = _context.Timelines.Where(t => t.TeamId == teamId);
            _context.Timelines.RemoveRange(teamTimelines);

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    public async Task<Team?> GetByIdAsync(string teamId)
    {
        return await _context.Teams.FirstOrDefaultAsync(t => t.TeamId == teamId);
    }
}