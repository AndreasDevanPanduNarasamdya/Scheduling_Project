using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.DTO;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IActivityLogRepository _activityLogRepository;

    public ActivityLogService(IActivityLogRepository activityLogRepository)
    {
        _activityLogRepository = activityLogRepository;
    }

    public async Task<List<ActivityLogResponse>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId)
    {
        var logs = await _activityLogRepository.GetLogsAsync(startDate, endDate, staffId, teamId);

        return logs.Select(l => new ActivityLogResponse
        {
            LogId = l.LogId,
            Timestamp = l.Timestamp,
            ActionType = l.ActionType,
            StaffName = l.SnapshotName,
            Position = l.SnapshotPosition,
            TeamName = l.SnapshotTeamName,
            Description = l.Description
        }).ToList();
    }

    public async Task LogScheduleCreatedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId)
    {
        var subjectName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName;
        var description = staff != null
            ? $"Created rotation ({timeline.DaysOn} on / {timeline.DaysOff} off) for staff {subjectName}, starting {timeline.StartDate:yyyy-MM-dd}"
            : $"Created rotation ({timeline.DaysOn} on / {timeline.DaysOff} off) for team {team?.TeamName}, starting {timeline.StartDate:yyyy-MM-dd}";

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Timestamp = DateTime.UtcNow,
            ActionType = "CreateSchedule",
            ActorStaffId = actorStaffId,
            SubjectStaffId = staff?.StaffId,
            SubjectTeamId = team?.TeamId,
            SnapshotName = staff != null ? subjectName : null,
            SnapshotPosition = staff?.Position,
            SnapshotTeamName = team?.TeamName,
            Description = description
        });
    }

    public async Task LogScheduleChangedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId, string changeSummary)
    {
        var subjectName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName;

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Timestamp = DateTime.UtcNow,
            ActionType = "ChangeSchedule",
            ActorStaffId = actorStaffId,
            SubjectStaffId = staff?.StaffId,
            SubjectTeamId = team?.TeamId,
            SnapshotName = staff != null ? subjectName : null,
            SnapshotPosition = staff?.Position,
            SnapshotTeamName = team?.TeamName,
            Description = changeSummary
        });
    }

    public async Task LogScheduleDeletedAsync(Staff? staff, Team? team, string? actorStaffId)
    {
        var subjectName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName;
        var description = staff != null
            ? $"Deleted rotation schedule for staff {subjectName}"
            : $"Deleted rotation schedule for team {team?.TeamName}";

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Timestamp = DateTime.UtcNow,
            ActionType = "DeleteSchedule",
            ActorStaffId = actorStaffId,
            SubjectStaffId = staff?.StaffId,
            SubjectTeamId = team?.TeamId,
            SnapshotName = staff != null ? subjectName : null,
            SnapshotPosition = staff?.Position,
            SnapshotTeamName = team?.TeamName,
            Description = description
        });
    }

    public async Task LogTicketCreatedAsync(Ticket ticket, Staff staff, string? actorStaffId)
    {
        var staffName = $"{staff.FirstName} {staff.LastName}".Trim();

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Timestamp = DateTime.UtcNow,
            ActionType = "CreateTicket",
            ActorStaffId = actorStaffId,
            SubjectStaffId = staff.StaffId,
            SnapshotName = staffName,
            SnapshotPosition = staff.Position,
            Description = $"Submitted ticket \"{ticket.Title}\" ({ticket.Type}) from {ticket.StartDate:yyyy-MM-dd} to {ticket.EndDate:yyyy-MM-dd}"
        });
    }
}