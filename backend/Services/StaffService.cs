using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.DTO.Requests;
using Action = SchedulingMeruap.Api.Models.Action;

namespace SchedulingMeruap.Api.Services;

public class StaffService : IStaffService
{
    private readonly IStaffRepository _staffRepository;
    private readonly IActivityLogService _activityLogService;
    private readonly ITeamRepository _teamRepository;

    public StaffService(
            IStaffRepository staffRepository,
            IActivityLogService activityLogService,
            ITeamRepository teamRepository)
    {
        _staffRepository = staffRepository;
        _activityLogService = activityLogService;
        _teamRepository = teamRepository;
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
            Sex = staff.Sex,
            Position = staff.Position,
            Phone = staff.Phone,
            Dob = staff.Dob,
            JoinDate = staff.JoinDate,
            Email = staff.User?.Email,
            Clearance = staff.User?.Clearance ?? Clearance.Staff
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

    public async Task<bool> AssignStaffAsync(StaffRequest dto, string? actorStaffId)
    {
        var staff = await _staffRepository.GetByIdAsync(dto.StaffId);
        if (staff == null) return false;

        var allTeams = await _teamRepository.GetAllTeamsWithStaffAsync();
        var oldTeam = allTeams.FirstOrDefault(t => t.StaffTeams.Any(st => st.StaffId == dto.StaffId));

        await _staffRepository.AssignStaffToTeamAsync(dto.StaffId, dto.TeamId);

        Team newTeam;
        if (dto.TeamId == "unassigned" || string.IsNullOrWhiteSpace(dto.TeamId))
        {
            newTeam = new Team { TeamName = "Unassigned" }; // Dummy team for the log
        }
        else
        {
            newTeam = await _teamRepository.GetByIdAsync(dto.TeamId)
                      ?? new Team { TeamName = "Unknown Team" };
        }

        await _activityLogService.LogTeamMemberSwitchedAsync(staff, oldTeam, newTeam, actorStaffId, "Memperbarui penugasan tim");

        return true;
    }

    public async Task DeleteStaffAsync(string staffId, string? actorStaffId)
    {
        if (string.IsNullOrEmpty(staffId))
            throw new ArgumentException("Staff ID is required.");

        // 🔥 Grab the staff info BEFORE deleting so we can log their name!
        var staff = await _staffRepository.GetByIdAsync(staffId);
        if (staff == null) throw new ArgumentException("Staff not found.");

        string staffName = $"{staff.FirstName} {staff.LastName}".Trim();

        await _staffRepository.DeleteStaffAsync(staffId);

        // 🔥 Trigger the log!
        await _activityLogService.LogStaffDeletedAsync(staffName, actorStaffId);
    }

    public async Task UpdateStaffAsync(string staffId, UpdateStaffRequest request, string? actorStaffId)
    {
        // 1. Fetch the existing staff member (Includes the User navigation property)
        var staff = await _staffRepository.GetByIdAsync(staffId);
        if (staff == null)
        {
            throw new ArgumentException("Staff member not found.");
        }

        // 🔥 2. SNAPSHOT THE OLD STATE before we overwrite it!
        var oldStaffSnapshot = new Staff
        {
            FirstName = staff.FirstName,
            LastName = staff.LastName,
            Sex = staff.Sex,
            Position = staff.Position,
            Phone = staff.Phone,
            Dob = staff.Dob,
            JoinDate = staff.JoinDate
        };

        // 3. Update the pure STAFF properties (staff now becomes the "newStaff")
        staff.FirstName = request.FirstName;
        staff.LastName = request.LastName;
        staff.Sex = (Sex)request.Sex;
        staff.Position = request.Position;
        staff.Phone = request.Phone;
        staff.Dob = request.Dob;
        staff.JoinDate = request.JoinDate;

        // 4. Update the linked USER property (The Email)
        if (staff.User != null)
        {
            staff.User.Email = request.Email;
            staff.User.Clearance = request.Clearance;
        }

        // 5. Save to database
        await _staffRepository.UpdateAsync(staff);

        // 6. 🔥 Pass BOTH the old snapshot and the newly updated staff!
        await _activityLogService.LogStaffEditedAsync(oldStaffSnapshot, staff, actorStaffId, "Memperbarui informasi profil staf");
    }
}