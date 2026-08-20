using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface IActivityLogService
{
    Task<List<ActivityLogResponse>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId);
    Task LogScheduleCreatedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId);
    Task LogScheduleChangedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId, string changeSummary);
    Task LogScheduleDeletedAsync(Staff? staff, Team? team, string? actorStaffId);
    Task LogTicketCreatedAsync(Ticket ticket, Staff staff, string? actorStaffId);
    Task LogTicketApprovedAsync(Ticket ticket, Staff staff, string? actorStaffId);
    Task LogTicketDeclinedAsync(Ticket ticket, Staff staff, string? actorStaffId, string declineReason);
    Task LogStaffCreatedAsync(Staff staff, string? actorStaffId);
    Task LogStaffEditedAsync(Staff staff, string? actorStaffId, string changeSummary);
    Task LogStaffDeletedAsync(string staffName, string? actorStaffId);
    Task LogAccountActivatedAsync(Staff staff);
    Task LogTeamCreatedAsync(Team team, string? actorStaffId);
    Task LogTeamEditedAsync(Team team, string? actorStaffId, string changeSummary);
    Task LogTeamDeletedAsync(string teamName, string? actorStaffId);
}