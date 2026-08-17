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
    private readonly ITimelineRepository _timelineRepository;

    public ActivityLogService(IActivityLogRepository activityLogRepository, ITimelineRepository timelineRepository)
    {
        _activityLogRepository = activityLogRepository;
        _timelineRepository = timelineRepository;
    }

    public async Task<List<ActivityLogResponse>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId)
    {
        var logs = await _activityLogRepository.GetLogsAsync(startDate, endDate, staffId, teamId);

        return logs.Select(l => new ActivityLogResponse
        {
            LogId = l.LogId,
            Timestamp = l.Timestamp,
            StaffName = l.SnapshotName,
            Position = l.SnapshotPosition,
            TeamName = l.SnapshotTeamName,
            DutyStatus = l.DutyStatus,
            Reason = l.Reason,
            Description = l.Description,
            SourceType = l.SourceType,
            SourceDetail = l.SourceDetail
        }).ToList();
    }

    public async Task GenerateDailyLogsAsync(DateTime forDate)
    {
        var date = forDate.Date;
        var teams = await _timelineRepository.GetTeamsWithStaffAndTicketsAsync();
        var timelines = await _timelineRepository.GetActiveTimelinesAsync(date, date);

        var logsToInsert = new List<ActivityLog>();

        foreach (var team in teams)
        {
            foreach (var staffTeam in team.StaffTeams)
            {
                var staff = staffTeam.Staff;
                if (staff == null) continue;

                var (dutyStatus, reason, description, sourceType, sourceDetail) =
                    ResolveDailyStatus(staff, team, date, timelines);

                logsToInsert.Add(new ActivityLog
                {
                    LogId = Guid.NewGuid().ToString(),
                    Timestamp = date,
                    SubjectStaffId = staff.StaffId,
                    SubjectTeamId = team.TeamId,
                    SnapshotName = $"{staff.FirstName} {staff.LastName}".Trim(),
                    SnapshotPosition = staff.Position,
                    SnapshotTeamName = team.TeamName,
                    DutyStatus = dutyStatus,
                    Reason = reason,
                    Description = description,
                    SourceType = sourceType,
                    SourceDetail = sourceDetail
                });
            }
        }

        await _activityLogRepository.AddRangeAsync(logsToInsert);
    }
    private (string DutyStatus, string? Reason, string? Description, string SourceType, string? SourceDetail)
    ResolveDailyStatus(Staff staff, Team team, DateTime date, List<Timeline> timelines)
    {
        var rotation = timelines.FirstOrDefault(t => t.StaffId == staff.StaffId)
                    ?? timelines.FirstOrDefault(t => t.TeamId == team.TeamId);

        var sourceType = timelines.Any(t => t.StaffId == staff.StaffId)
            ? "PersonalSchedule"
            : "TeamSchedule";

        bool isOnFromRotation = false;
        if (rotation != null && date >= rotation.StartDate.Date && (!rotation.EndDate.HasValue || date <= rotation.EndDate.Value.Date))
        {
            int cycleLength = rotation.DaysOn + rotation.DaysOff;
            int dayInCycle = (date - rotation.StartDate.Date).Days % cycleLength;
            isOnFromRotation = dayInCycle < rotation.DaysOn;
        }

        var activeTicket = staff.Tickets.FirstOrDefault(t =>
            t.Status == TicketStatus.Approved &&
            date >= t.StartDate.Date && date <= t.EndDate.Date);

        if (activeTicket != null)
        {
            if (activeTicket.Type == TicketType.On)
                return ("OnDuty", "Ticket override", activeTicket.Title, "FromTicket", activeTicket.Title);

            return ("OffDuty", activeTicket.Reason, activeTicket.Title, "FromTicket", activeTicket.Title);
        }

        return isOnFromRotation
            ? ("OnDuty", "Scheduled duty", "Regular shift", sourceType, sourceType == "TeamSchedule" ? team.TeamName : "Personal rotation")
            : ("OffDuty", "Scheduled rest", "Rotation rest day", sourceType, sourceType == "TeamSchedule" ? team.TeamName : "Personal rotation");
    }
}