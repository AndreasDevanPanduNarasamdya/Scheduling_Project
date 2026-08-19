using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.DTO;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;
using Action = SchedulingMeruap.Api.Models.Action;

namespace SchedulingMeruap.Api.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IActivityLogRepository _activityLogRepository;
    private readonly IStaffRepository _staffRepository;

    public ActivityLogService(
        IActivityLogRepository activityLogRepository,
        IStaffRepository staffRepository)
    {
        _activityLogRepository = activityLogRepository;
        _staffRepository = staffRepository;
    }

    // Helper method to convert the Actor ID into their full name
    private async Task<string> GetActorNameAsync(string? actorStaffId)
    {
        if (string.IsNullOrEmpty(actorStaffId)) return "Sistem";
        var actor = await _staffRepository.GetByIdAsync(actorStaffId);
        return actor != null ? $"{actor.FirstName} {actor.LastName}".Trim() : "Sistem";
    }

    public async Task<List<ActivityLogResponse>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId)
    {
        var logs = await _activityLogRepository.GetLogsAsync(startDate, endDate, staffId, teamId);

        return logs.Select(l => new ActivityLogResponse
        {
            LogId = l.LogId,
            Date = l.Date,     // 🔥 Pure DateTime
            Time = l.Time,     // 🔥 Pure TimeSpan
            Actor = l.Actor,
            Action = l.Action, // 🔥 Pure Enum mapping
            DateRange = l.DateRange,
            Rotation = l.Rotation,
            Target = l.Target,
            Description = l.Description
        }).ToList();
    }

    public async Task LogScheduleCreatedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName ?? "Sistem";
        var actionEnum = staff != null ? Action.CreatePersonalSchedule : Action.CreateTeamSchedule; // 🔥 Uses Action enum

        var dateRange = $"{timeline.StartDate:yyyy-MM-dd} - {(timeline.EndDate.HasValue ? timeline.EndDate.Value.ToString("yyyy-MM-dd") : "Seterusnya")}";
        var rotation = $"{timeline.DaysOn} On / {timeline.DaysOff} Off";

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = DateTime.UtcNow.Date,
            Time = DateTime.UtcNow.TimeOfDay,
            Actor = actorName,
            Action = actionEnum,
            DateRange = dateRange,
            Rotation = rotation,
            Target = targetName,
            Description = null
        });
    }

    public async Task LogScheduleChangedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId, string changeSummary)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName ?? "Sistem";
        var actionEnum = staff != null ? Action.EditPersonalSchedule : Action.EditTeamSchedule; // 🔥 Uses Action enum

        var dateRange = $"{timeline.StartDate:yyyy-MM-dd} - {(timeline.EndDate.HasValue ? timeline.EndDate.Value.ToString("yyyy-MM-dd") : "Seterusnya")}";
        var rotation = $"{timeline.DaysOn} On / {timeline.DaysOff} Off";

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = DateTime.UtcNow.Date,
            Time = DateTime.UtcNow.TimeOfDay,
            Actor = actorName,
            Action = actionEnum,
            DateRange = dateRange,
            Rotation = rotation,
            Target = targetName,
            Description = changeSummary
        });
    }

    public async Task LogScheduleDeletedAsync(Staff? staff, Team? team, string? actorStaffId)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName ?? "Sistem";
        var actionEnum = staff != null ? Action.RemovePersonalSchedule : Action.RemoveTeamSchedule; // 🔥 Uses Action enum

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = DateTime.UtcNow.Date,
            Time = DateTime.UtcNow.TimeOfDay,
            Actor = actorName,
            Action = actionEnum,
            DateRange = null,
            Rotation = null,
            Target = targetName,
            Description = "Menghapus jadwal dari sistem"
        });
    }

    public async Task LogTicketCreatedAsync(Ticket ticket, Staff staff, string? actorStaffId)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = $"{staff.FirstName} {staff.LastName}".Trim();
        var dateRange = $"{ticket.StartDate:yyyy-MM-dd} - {ticket.EndDate:yyyy-MM-dd}";

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = DateTime.UtcNow.Date,
            Time = DateTime.UtcNow.TimeOfDay,
            Actor = actorName,
            Action = Action.CreateTicket, // 🔥 Uses Action enum
            DateRange = dateRange,
            Rotation = null,
            Target = targetName,
            Description = ticket.Title ?? "Pengajuan Tiket Baru"
        });
    }
}