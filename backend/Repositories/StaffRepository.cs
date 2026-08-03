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
}