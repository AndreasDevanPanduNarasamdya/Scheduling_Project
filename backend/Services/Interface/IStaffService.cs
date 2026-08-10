using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface IStaffService
{
    Task<StaffResponse?> GetByIdAsync(string staffId);
    Task<StaffResponse?> GetByUserIdAsync(string userId);
    Task<List<StaffResponse>> GetAllAsync();
    Task<List<TeamMemberResponse>> GetUnassignedStaffAsync();
    Task<bool> AssignStaffAsync(StaffRequest dto);
}