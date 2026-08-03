using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;

namespace SchedulingMeruap.Api.Services;

public class StaffService : IStaffService
{
    private readonly IStaffRepository _staffRepository;

    public StaffService(IStaffRepository staffRepository)
    {
        _staffRepository = staffRepository;
    }

    public async Task<StaffResponse?> GetByIdAsync(string staffId)
    {
        var staff = await _staffRepository.GetByIdAsync(staffId);
        return staff == null ? null : MapToDto(staff);
    }

    public async Task<StaffResponse?> GetByUserIdAsync(string userId)
    {
        var staff = await _staffRepository.GetByUserIdAsync(userId);
        return staff == null ? null : MapToDto(staff);
    }

    public async Task<List<StaffResponse>> GetAllAsync()
    {
        var staffList = await _staffRepository.GetAllAsync();
        return staffList.Select(MapToDto).ToList();
    }

    private static StaffResponse MapToDto(Staff staff)
    {
        return new StaffResponse
        {
            StaffId = staff.StaffId,
            FirstName = staff.FirstName,
            LastName = staff.LastName,
            Position = staff.Position,
            Phone = staff.Phone,
            JoinDate = staff.JoinDate
        };
    }
}