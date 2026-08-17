using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;

namespace SchedulingMeruap.Api.Repositories;

public class StaffRepository : IStaffRepository
{
    private readonly ApplicationDbContext _dbContext;

    public StaffRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Staff?> GetByIdAsync(string staffId)
    {
        return await _dbContext.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId);
    }

    public async Task<Staff?> GetByUserIdAsync(string userId)
    {
        return await _dbContext.Staff
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task<List<Staff>> GetAllAsync()
    {
        return await _dbContext.Staff.ToListAsync();
    }

    public async Task UpdateAsync(Staff staff)
    {
        _dbContext.Staff.Update(staff);
        await _dbContext.SaveChangesAsync();
    }
    public async Task<List<Staff>> GetUnassignedStaffAsync()
    {
        return await _dbContext.Staff
            .Include(s => s.StaffTeams)
            .Where(s => !s.StaffTeams.Any())
            .ToListAsync();
    }
    public async Task AssignStaffToTeamAsync(string staffId, string teamId)
    {
        // 1. Remove old assignments for this staff
        var existingAssignments = await _dbContext.StaffTeams
            .Where(st => st.StaffId == staffId)
            .ToListAsync();

        _dbContext.StaffTeams.RemoveRange(existingAssignments);

        // 2. Add new assignment (unless frontend sent "unassigned")
        if (teamId != "unassigned" && !string.IsNullOrWhiteSpace(teamId))
        {
            _dbContext.StaffTeams.Add(new StaffTeam
            {
                StaffTeamId = Guid.NewGuid().ToString(), // Generate the string ID!
                StaffId = staffId,
                TeamId = teamId
            });
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task DeleteStaffAsync(string staffId)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var staff = await _dbContext.Staff.FirstOrDefaultAsync(s => s.StaffId == staffId);
            if (staff == null) return;

            var tickets = _dbContext.Tickets.Where(t => t.StaffId == staffId);
            _dbContext.Tickets.RemoveRange(tickets);

            var personalTimelines = _dbContext.Timelines.Where(t => t.StaffId == staffId);
            _dbContext.Timelines.RemoveRange(personalTimelines);

            var staffTeams = _dbContext.StaffTeams.Where(st => st.StaffId == staffId);
            _dbContext.StaffTeams.RemoveRange(staffTeams);

            var userId = staff.UserId;

            _dbContext.Staff.Remove(staff);
            await _dbContext.SaveChangesAsync();

            if (!string.IsNullOrEmpty(userId))
            {
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user != null)
                {
                    _dbContext.Users.Remove(user);
                    await _dbContext.SaveChangesAsync();
                }
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}