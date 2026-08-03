using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface IStaffRepository
{
    Task<Staff?> GetByIdAsync(string staffId);
    Task<Staff?> GetByUserIdAsync(string userId);
    Task<List<Staff>> GetAllAsync();
    Task UpdateAsync(Staff staff);
}