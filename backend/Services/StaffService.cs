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
    private readonly ITimelineService _timelineService;

    public StaffService(
        IStaffRepository staffRepository,
        IActivityLogService activityLogService,
        ITeamRepository teamRepository,
        ITimelineService timelineService)
    {
        _staffRepository = staffRepository;
        _activityLogService = activityLogService;
        _teamRepository = teamRepository;
        _timelineService = timelineService;
    }

    public async Task<StaffResponse?> GetByIdAsync(string staffId)
    {
        var staff = await _staffRepository.GetByIdAsync(staffId);
        return staff is null ? null : MapToDto(staff);
    }

    public async Task<StaffResponse?> GetByUserIdAsync(string userId)
    {
        var staff = await _staffRepository.GetByUserIdAsync(userId);
        return staff is null ? null : MapToDto(staff);
    }

    public async Task<List<StaffResponse>> GetAllAsync()
    {
        var staffList = await _staffRepository.GetAllAsync();
        return staffList.Select(MapToDto).ToList();
    }

    public async Task<List<TeamMemberResponse>> GetUnassignedStaffAsync()
    {
        var staffList = await _staffRepository.GetUnassignedStaffAsync();
        var staffIds = staffList.Select(s => s.StaffId).ToList();
        var statusMap = await _timelineService.GetCurrentStatusForStaffAsync(staffIds);

        return staffList.Select(s =>
        {
            var (status, note) = statusMap.TryGetValue(s.StaffId, out var result)
                ? result
                : ("OFF", "Tidak ada jadwal aktif");

            return new TeamMemberResponse
            {
                StaffId = s.StaffId,
                Name = $"{s.FirstName} {s.LastName}".Trim(),
                Position = s.Position,
                Status = status,
                Note = note
            };
        }).ToList();
    }

    public async Task<bool> AssignStaffAsync(StaffRequest dto, string? actorStaffId)
    {
        var staff = await _staffRepository.GetByIdAsync(dto.StaffId);
        if (staff is null) return false;

        // Note: Pulling ALL teams into memory here is a heavy DB hit.
        // If the app gets slow later, write a Repo method to fetch just the ONE old team.
        var allTeams = await _teamRepository.GetAllTeamsWithStaffAsync();
        var oldTeam = allTeams.FirstOrDefault(t => t.StaffTeams.Any(st => st.StaffId == dto.StaffId));

        await _staffRepository.AssignStaffToTeamAsync(dto.StaffId, dto.TeamId);

        var isUnassigned = string.IsNullOrWhiteSpace(dto.TeamId) || dto.TeamId == "unassigned";

        Team newTeam = isUnassigned
            ? new() { TeamName = "Unassigned" }
            : await _teamRepository.GetByIdAsync(dto.TeamId) ?? new() { TeamName = "Unknown Team" };

        await _activityLogService.LogTeamMemberSwitchedAsync(staff, oldTeam, newTeam, actorStaffId, "Memperbarui penugasan tim");

        return true;
    }

    public async Task DeleteStaffAsync(string staffId, string? actorStaffId)
    {
        if (string.IsNullOrWhiteSpace(staffId))
            throw new ArgumentException("Staff ID is required.");

        var staff = await _staffRepository.GetByIdAsync(staffId);
        if (staff is null) throw new ArgumentException("Staff not found.");

        string staffName = $"{staff.FirstName} {staff.LastName}".Trim();

        await _staffRepository.DeleteStaffAsync(staffId);
        await _activityLogService.LogStaffDeletedAsync(staffName, actorStaffId);
    }

    public async Task UpdateStaffAsync(string staffId, UpdateStaffRequest request, string? actorStaffId)
    {
        var staff = await _staffRepository.GetByIdAsync(staffId);
        if (staff is null) throw new ArgumentException("Staff member not found.");

        if (staff.User is null)
            throw new InvalidOperationException(
                $"Staff '{staffId}' has no linked User record loaded. Cannot update Email/Clearance.");

        Staff oldStaffSnapshot = new()
        {
            FirstName = staff.FirstName,
            LastName = staff.LastName,
            Sex = staff.Sex,
            Position = staff.Position,
            Phone = staff.Phone,
            Dob = staff.Dob,
            JoinDate = staff.JoinDate
        };
        var oldEmail = staff.User.Email;
        var oldClearance = staff.User.Clearance;

        staff.FirstName = request.FirstName;
        staff.LastName = request.LastName;
        staff.Sex = (Sex)request.Sex;
        staff.Position = request.Position;
        staff.Phone = request.Phone;
        staff.Dob = request.Dob;
        staff.JoinDate = request.JoinDate;
        staff.User.Email = request.Email;
        staff.User.Clearance = request.Clearance;

        await _staffRepository.UpdateAsync(staff);
        await _activityLogService.LogStaffEditedAsync(
            oldStaffSnapshot, staff,
            oldEmail, staff.User.Email,
            oldClearance, staff.User.Clearance,
            actorStaffId, "Memperbarui informasi profil staf");
    }

    private static StaffResponse MapToDto(Staff staff) => new()
    {
        StaffId = staff.StaffId,
        FirstName = staff.FirstName,
        LastName = staff.LastName,
        Sex = (int)staff.Sex,
        Position = staff.Position,
        Phone = staff.Phone,
        Dob = staff.Dob,
        JoinDate = staff.JoinDate,
        Email = staff.User?.Email,
        Clearance = (int)(staff.User?.Clearance ?? Models.Clearance.Staff)
    };
}