using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface IActivityLogService
{
    Task<List<ActivityLogResponse>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId);

    // ==========================================
    // SCHEDULE LOGS
    // ==========================================
    Task LogScheduleCreatedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId, string? note = null);
    Task LogScheduleChangedAsync(Timeline oldTimeline, Timeline newTimeline, Staff? staff, Team? team, string? actorStaffId, string? note = null);
    Task LogScheduleDeletedAsync(Timeline deleted, Staff? staff, Team? team, string? actorStaffId, string? note = null);

    // ==========================================
    // TICKET LOGS
    // ==========================================
    Task LogTicketCreatedAsync(Ticket ticket, Staff staff, string? actorStaffId);
    Task LogTicketApprovedAsync(Ticket ticket, Staff staff, string? actorStaffId, string? note = null);
    Task LogTicketDeclinedAsync(Ticket ticket, Staff staff, string? actorStaffId, string declineReason);

    // ==========================================
    // STAFF LOGS
    // ==========================================
    Task LogStaffCreatedAsync(Staff staff, string? actorStaffId, string? note = null);
    Task LogStaffEditedAsync(
        Staff oldStaff, Staff newStaff,
        string? oldEmail, string? newEmail,
        Models.Clearance oldClearance, Models.Clearance newClearance,
        string? actorStaffId, string? note = null);
    Task LogStaffDeletedAsync(string staffName, string? actorStaffId, string? note = null);
    Task LogAccountActivatedAsync(Staff staff);

    // ==========================================
    // TEAM LOGS
    // ==========================================
    Task LogTeamCreatedAsync(Team team, string? actorStaffId, string? note = null);
    Task LogTeamEditedAsync(string oldTeamName, Team newTeam, string? actorStaffId, string? note = null);
    Task LogTeamDeletedAsync(string teamName, string? actorStaffId, string? note = null);
    Task LogTeamMemberSwitchedAsync(Staff staff, Team? oldTeam, Team newTeam, string? actorStaffId, string? note = null);
}