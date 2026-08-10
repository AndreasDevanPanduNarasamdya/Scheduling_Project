using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.DTO.Requests;

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
    public async Task<List<TeamMemberResponse>> GetUnassignedStaffAsync()
    {
        var staffList = await _staffRepository.GetUnassignedStaffAsync();

        return staffList.Select(s => new TeamMemberResponse
        {
            StaffId = s.StaffId,
            Name = $"{s.FirstName} {s.LastName}",
            Position = s.Position,
            Status = "OFF",
            Note = null
        }).ToList();
    }

    // NEW
    public async Task<bool> AssignStaffAsync(StaffRequest dto)
    {
        // Check if staff exists first
        var staff = await _staffRepository.GetByIdAsync(dto.StaffId);
        if (staff == null) return false;

        await _staffRepository.AssignStaffToTeamAsync(dto.StaffId, dto.TeamId);
        return true;
    }
}