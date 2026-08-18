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
}