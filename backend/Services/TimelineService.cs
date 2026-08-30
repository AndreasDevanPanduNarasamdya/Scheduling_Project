using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.DTO;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services;

public class TimelineService : ITimelineService
{
    private readonly ITimelineRepository _repository;
    private readonly IActivityLogService _activityLogService;
    private readonly ITeamRepository _teamRepository;
    private readonly IStaffRepository _staffRepository;

    public TimelineService(
        ITimelineRepository repository,
        IActivityLogService activityLogService,
        ITeamRepository teamRepository,
        IStaffRepository staffRepository)
    {
        _repository = repository;
        _activityLogService = activityLogService;
        _teamRepository = teamRepository;
        _staffRepository = staffRepository;
    }

    public async Task<List<TimelineTeamResponse>> GetTimelineDataAsync(TimelineRequest request)
    {
        var startDate = request.StartDate == default ? new DateTime(DateTime.UtcNow.Year, 1, 1) : request.StartDate;
        var endDate = request.EndDate == default ? new DateTime(DateTime.UtcNow.Year, 12, 31) : request.EndDate;

        var teamsData = await _repository.GetTeamsWithStaffAndTicketsAsync();
        var activeTimelines = await _repository.GetActiveTimelinesAsync(
            startDate.AddDays(-5),
            endDate.AddDays(5)
        );

        List<TimelineTeamResponse> response = [];

        foreach (var team in teamsData)
        {
            TimelineTeamResponse teamDto = new()
            {
                TeamId = team.TeamId,
                TeamName = team.TeamName,
                Members = []
            };

            foreach (var staffTeam in team.StaffTeams)
            {
                var staff = staffTeam.Staff;
                if (staff is null) continue;

                TimelineStaffResponse staffDto = new()
                {
                    StaffId = staff.StaffId,
                    Name = $"{staff.FirstName} {staff.LastName}".Trim(),
                    Position = staff.Position ?? "Staff",
                    Days = BuildTimelineDayResponses(staff, team, activeTimelines, startDate, endDate)
                };

                teamDto.Members.Add(staffDto);
            }
            response.Add(teamDto);
        }

        return response;
    }

    private List<TimelineDayResponse> BuildTimelineDayResponses(Staff staff, Team team, List<Timeline> activeTimelines, DateTime startDate, DateTime endDate)
    {
        var queryStart = startDate.AddDays(-5);
        var queryEnd = endDate.AddDays(5);

        // 🔥 1. Add 'Label' to the dictionary so it can hold the ticket description
        var baseStates = new Dictionary<DateTime, (string State, string? Label, string? SourceId, bool IsStaffSchedule)>();

        for (var date = queryStart; date <= queryEnd; date = date.AddDays(1))
        {
            var baseRotation = ResolveBaseRotationState(date, staff.StaffId, team.TeamId, activeTimelines);

            // 🔥 2. Apply Ticket BEFORE transitions so we know the true shape of the blocks!
            baseStates[date] = ApplyTicketOverride(date, baseRotation, staff.Tickets);
        }

        // 🔥 3. Now run the transition rules on the final cut-up shapes
        ApplyTransitionRules(baseStates);

        var days = new List<TimelineDayResponse>();
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var finalState = baseStates[date];

            string? sType = null, sPattern = null, sStart = null, sEnd = null;
            if (finalState.SourceId != null)
            {
                var tl = activeTimelines.FirstOrDefault(t => t.TimelineId == finalState.SourceId);
                if (tl != null)
                {
                    sType = string.IsNullOrWhiteSpace(tl.StaffId) ? $"Tim: {team.TeamName}" : "Personal";
                    sPattern = $"{tl.DaysOn} ON / {tl.DaysOff} OFF";
                    sStart = tl.StartDate.ToString("yyyy-MM-dd");
                    sEnd = tl.EndDate.ToString("yyyy-MM-dd");
                }
            }

            if (finalState.State != "Work" && finalState.State != "NoSchedule")
            {
                days.Add(new TimelineDayResponse
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    BarType = finalState.State,
                    Label = finalState.Label,
                    ScheduleType = sType,
                    SchedulePattern = sPattern,
                    ScheduleStart = sStart,
                    ScheduleEnd = sEnd
                });
            }
        }

        return days;
    }

    // Rule 2 & 3: staff-specific schedule always wins over team when it
    // applies to this date; team is only consulted when no staff schedule
    // covers this date at all (including before/after the staff schedule's
    // start/end — team naturally resumes there since GetApplicableTimeline
    // won't return an out-of-range staff schedule).
    private (string State, string? SourceId, bool IsStaffSchedule) ResolveBaseRotationState(DateTime date, string staffId, string teamId, List<Timeline> timelines)
    {
        Timeline? staffRotation = GetApplicableTimeline(timelines, staffId, isTeam: false, date);
        if (staffRotation is not null)
        {
            int cycleLength = staffRotation.DaysOn + staffRotation.DaysOff;
            int dayInCycle = (date - staffRotation.StartDate.Date).Days % cycleLength;
            if (dayInCycle >= staffRotation.DaysOn) return ("OffDuty", staffRotation.TimelineId, true);
            return ("Work", staffRotation.TimelineId, true);
        }

        Timeline? teamRotation = GetApplicableTimeline(timelines, teamId, isTeam: true, date);
        if (teamRotation is not null)
        {
            int cycleLength = teamRotation.DaysOn + teamRotation.DaysOff;
            int dayInCycle = (date - teamRotation.StartDate.Date).Days % cycleLength;
            if (dayInCycle >= teamRotation.DaysOn) return ("OffDuty", teamRotation.TimelineId, false);
            return ("Work", teamRotation.TimelineId, false);
        }

        return ("NoSchedule", null, false);
    }

    // Rule 5 & 6, corrected: transition is carved from EVERY off block,
    // no minimum length. First and last day of each OffDuty run become
    // Transition; if the block is exactly 1 day, that single day becomes
    // Transition (start == end); anything in between stays OffDuty.
    // 🔥 Updated dictionary signature to match
    private void ApplyTransitionRules(Dictionary<DateTime, (string State, string? Label, string? SourceId, bool IsStaffSchedule)> baseStates)
    {
        var dates = baseStates.Keys.OrderBy(d => d).ToList();

        int i = 0;
        while (i < dates.Count)
        {
            // 🔥 Treat touching OffDuty and Leave as ONE giant combined block
            if (baseStates[dates[i]].State == "OffDuty" || baseStates[dates[i]].State == "Leave")
            {
                int startIdx = i;
                bool hasLeaveTicket = false;

                // Keep moving forward as long as the days are SOME kind of off-time
                while (i < dates.Count && (baseStates[dates[i]].State == "OffDuty" || baseStates[dates[i]].State == "Leave"))
                {
                    if (baseStates[dates[i]].State == "Leave")
                        hasLeaveTicket = true;
                    i++;
                }
                int endIdx = i - 1;

                // Calculate the COMBINED length of the touching blocks
                int totalLength = endIdx - startIdx + 1;

                // Only apply transitions if the combined block is >= 3 days (or contains a ticket)
                if (totalLength >= 3 || hasLeaveTicket)
                {
                    // Put a transition on the far left edge
                    UpdateDayState(baseStates, dates[startIdx], "Transition");

                    // Put a transition on the far right edge
                    if (endIdx != startIdx)
                    {
                        UpdateDayState(baseStates, dates[endIdx], "Transition");
                    }
                }
                // Because we jump 'i' to the end of the block, internal meeting edges are safely ignored!
            }
            else
            {
                i++;
            }
        }
    }
    private (string State, string? Label, string? SourceId, bool IsStaffSchedule) ApplyTicketOverride(
            DateTime date, (string State, string? SourceId, bool IsStaffSchedule) baseState, ICollection<Ticket> tickets)
    {
        var activeTicket = tickets.FirstOrDefault(t =>
            t.Status == TicketStatus.Approved &&
            date >= t.StartDate.Date && date <= t.EndDate.Date);

        if (activeTicket is not null)
        {
            if (activeTicket.Type == TicketType.On)
                return ("Work", null, baseState.SourceId, baseState.IsStaffSchedule);

            var label = activeTicket.Description ?? activeTicket.Reason ?? activeTicket.Title;

            // 🔥 JUST returns Leave. No transitions are calculated here!
            return ("Leave", label, baseState.SourceId, baseState.IsStaffSchedule);
        }

        return (baseState.State, null, baseState.SourceId, baseState.IsStaffSchedule);
    }

    private void UpdateDayState(Dictionary<DateTime, (string State, string? Label, string? SourceId, bool IsStaffSchedule)> states, DateTime date, string newState)
    {
        var current = states[date];
        states[date] = (newState, current.Label, current.SourceId, current.IsStaffSchedule);
    }

    private static Timeline? GetApplicableTimeline(List<Timeline> timelines, string targetId, bool isTeam, DateTime date)
    {
        return timelines
            .Where(t => (isTeam ? t.TeamId == targetId : t.StaffId == targetId)
                        && t.StartDate.Date <= date.Date
                        && t.EndDate.Date >= date.Date) // Rule 7: EndDate always present now
            .OrderByDescending(t => t.StartDate)
            .FirstOrDefault();
    }

    // Rule 7: EndDate is now MANDATORY — request.EndDate is a non-nullable
    // DateTime, not DateTime?. Update your CreateTimelineRequest DTO accordingly.
    public async Task<Timeline> CreateTimelineAsync(CreateTimelineRequest request, string? actorStaffId)
    {
        bool hasTeam = !string.IsNullOrWhiteSpace(request.TeamId);
        bool hasStaff = !string.IsNullOrWhiteSpace(request.StaffId);

        if (!hasTeam && !hasStaff)
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        if (hasTeam && hasStaff)
            throw new ArgumentException("Provide only one of TeamId or StaffId, not both.");

        if (request.EndDate.Date < request.StartDate.Date)
            throw new ArgumentException("EndDate cannot be earlier than StartDate.");

        if (request.DaysOn < 1 || request.DaysOff < 1)
            throw new ArgumentException("DaysOn and DaysOff must be greater than or equal to 1.");

        var existingTimelines = await _repository.GetTimelinesByTargetAsync(request.TeamId, request.StaffId);

        var overlappingSchedule = existingTimelines.FirstOrDefault(t =>
            t.StartDate.Date <= request.EndDate.Date &&
            t.EndDate.Date >= request.StartDate.Date
        );

        if (overlappingSchedule is not null)
        {
            string targetType = hasStaff ? "personal" : "tim";
            throw new ArgumentException($"Jadwal bertabrakan! Sudah ada jadwal {targetType} dari {overlappingSchedule.StartDate:yyyy-MM-dd} sampai {overlappingSchedule.EndDate:yyyy-MM-dd}.");
        }

        Timeline newTimeline = new()
        {
            TimelineId = Guid.NewGuid().ToString(),
            TeamId = request.TeamId,
            StaffId = request.StaffId,
            StartDate = request.StartDate.Date,
            DaysOn = request.DaysOn,
            DaysOff = request.DaysOff,
            EndDate = request.EndDate
        };

        var created = await _repository.CreateTimelineAsync(newTimeline);

        var staff = hasStaff ? await _staffRepository.GetByIdAsync(request.StaffId!) : null;
        var team = hasTeam ? await _teamRepository.GetByIdAsync(request.TeamId!) : null;
        await _activityLogService.LogScheduleCreatedAsync(created, staff, team, actorStaffId);

        return created;
    }

    public async Task<List<TimelineHistoryResponse>> GetTimelineHistoryAsync(string? teamId, string? staffId, bool includeHistorical = false)
    {
        if (string.IsNullOrWhiteSpace(teamId) && string.IsNullOrWhiteSpace(staffId))
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        if (!string.IsNullOrWhiteSpace(teamId) && !string.IsNullOrWhiteSpace(staffId))
            throw new ArgumentException("Provide only one of TeamId or StaffId, not both.");

        var timelines = await _repository.GetTimelinesByTargetAsync(teamId, staffId);
        var today = DateTime.UtcNow.Date;

        var mapped = timelines.OrderByDescending(t => t.StartDate).Select(t => new
        {
            Timeline = t,
            Status = GetStatus(t, today)
        });

        if (!includeHistorical)
            mapped = mapped.Where(x => x.Status != "Historical");

        return mapped.Select(x => new TimelineHistoryResponse
        {
            TimelineId = x.Timeline.TimelineId,
            TeamId = x.Timeline.TeamId,
            StaffId = x.Timeline.StaffId,
            StartDate = x.Timeline.StartDate.ToString("yyyy-MM-dd"),
            EndDate = x.Timeline.EndDate.ToString("yyyy-MM-dd"),
            DaysOn = x.Timeline.DaysOn,
            DaysOff = x.Timeline.DaysOff,
            Status = x.Status
        }).ToList();
    }

    public async Task UpdateTimelineAsync(string timelineId, UpdateTimelineRequest request, string? actorStaffId)
    {
        var timeline = await _repository.GetTimelineByIdAsync(timelineId);
        if (timeline is null)
            throw new ArgumentException("Schedule not found.");

        var today = DateTime.UtcNow.Date;
        if (GetStatus(timeline, today) == "Historical")
            throw new ArgumentException("This schedule has already ended and can no longer be edited.");

        if (request.EndDate.Date < request.StartDate.Date)
            throw new ArgumentException("EndDate cannot be earlier than StartDate.");

        if (request.DaysOn < 1 || request.DaysOff < 1)
            throw new ArgumentException("DaysOn and DaysOff must be greater than or equal to 1.");

        var existingTimelines = await _repository.GetTimelinesByTargetAsync(timeline.TeamId, timeline.StaffId);

        var overlappingSchedule = existingTimelines.FirstOrDefault(t =>
            t.TimelineId != timelineId &&
            t.StartDate.Date <= request.EndDate.Date &&
            t.EndDate.Date >= request.StartDate.Date
        );

        if (overlappingSchedule is not null)
        {
            throw new ArgumentException($"Update gagal! Tanggal bertabrakan dengan jadwal lain ({overlappingSchedule.StartDate:yyyy-MM-dd} s/d {overlappingSchedule.EndDate:yyyy-MM-dd}).");
        }

        Timeline oldTimelineSnapshot = new()
        {
            StartDate = timeline.StartDate,
            EndDate = timeline.EndDate,
            DaysOn = timeline.DaysOn,
            DaysOff = timeline.DaysOff
        };

        timeline.DaysOn = request.DaysOn;
        timeline.DaysOff = request.DaysOff;
        timeline.StartDate = request.StartDate.Date;
        timeline.EndDate = request.EndDate.Date;

        await _repository.UpdateTimelineAsync(timeline);

        var staff = !string.IsNullOrWhiteSpace(timeline.StaffId) ? await _staffRepository.GetByIdAsync(timeline.StaffId) : null;
        var team = !string.IsNullOrWhiteSpace(timeline.TeamId) ? await _teamRepository.GetByIdAsync(timeline.TeamId) : null;

        await _activityLogService.LogScheduleChangedAsync(oldTimelineSnapshot, timeline, staff, team, actorStaffId, "Updated timeline schedule configuration");
    }

    public async Task DeleteTimelineAsync(string timelineId, string? actorStaffId)
    {
        var timeline = await _repository.GetTimelineByIdAsync(timelineId);
        if (timeline is null)
            throw new ArgumentException("Schedule not found.");

        var today = DateTime.UtcNow.Date;
        if (GetStatus(timeline, today) == "Historical")
            throw new ArgumentException("This schedule has already ended and can no longer be deleted.");

        var staff = !string.IsNullOrWhiteSpace(timeline.StaffId) ? await _staffRepository.GetByIdAsync(timeline.StaffId) : null;
        var team = !string.IsNullOrWhiteSpace(timeline.TeamId) ? await _teamRepository.GetByIdAsync(timeline.TeamId) : null;

        await _repository.DeleteTimelineAsync(timelineId);

        await _activityLogService.LogScheduleDeletedAsync(timeline, staff, team, actorStaffId);
    }

    private static string GetStatus(Timeline t, DateTime today)
    {
        if (t.StartDate.Date <= today && t.EndDate.Date >= today)
            return "Active";
        if (t.StartDate.Date > today)
            return "Future";
        return "Historical";
    }

    public async Task<List<BlockedRangeResponse>> GetBlockedDateRangesAsync(string? teamId, string? staffId, string? excludeTimelineId = null)
    {
        bool hasTeam = !string.IsNullOrWhiteSpace(teamId);
        bool hasStaff = !string.IsNullOrWhiteSpace(staffId);

        if (!hasTeam && !hasStaff)
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        if (hasTeam && hasStaff)
            throw new ArgumentException("Provide only one of TeamId or StaffId, not both.");

        var existingTimelines = await _repository.GetTimelinesByTargetAsync(teamId, staffId);
        var today = DateTime.UtcNow.Date;

        return existingTimelines
            .Where(t => t.TimelineId != excludeTimelineId && GetStatus(t, today) != "Historical")
            .Select(t => new BlockedRangeResponse
            {
                TimelineId = t.TimelineId,
                StartDate = t.StartDate.ToString("yyyy-MM-dd"),
                EndDate = t.EndDate.ToString("yyyy-MM-dd")
            })
            .ToList();
    }
}