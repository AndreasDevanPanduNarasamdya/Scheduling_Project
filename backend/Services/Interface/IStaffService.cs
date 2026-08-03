using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface IStaffService
{
    Task<StaffResponse?> GetByIdAsync(string staffId);
    Task<StaffResponse?> GetByUserIdAsync(string userId);
    Task<List<StaffResponse>> GetAllAsync();
}