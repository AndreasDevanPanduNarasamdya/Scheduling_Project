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

        var response = new List<TimelineTeamResponse>();

        foreach (var team in teamsData)
        {
            var teamDto = new TimelineTeamResponse
            {
                TeamId = team.TeamId,
                TeamName = team.TeamName,
                Members = new List<TimelineStaffResponse>()
            };

            foreach (var staffTeam in team.StaffTeams)
            {
                var staff = staffTeam.Staff;
                if (staff == null) continue;

                var staffDto = new TimelineStaffResponse
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

        var baseStates = new Dictionary<DateTime, (string State, string? SourceId, bool IsStaffSchedule)>();

        for (var date = queryStart; date <= queryEnd; date = date.AddDays(1))
        {
            baseStates[date] = ResolveBaseRotationState(date, staff.StaffId, team.TeamId, activeTimelines);
        }

        ApplyTransitionRules(baseStates);

        var days = new List<TimelineDayResponse>();
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var dayData = baseStates[date];
            var finalState = ApplyTicketOverride(date, dayData, staff.Tickets);

            if (finalState.State != "Work" && finalState.State != "NoSchedule")
            {
                days.Add(new TimelineDayResponse
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    BarType = finalState.State,
                    Label = finalState.Label
                });
            }
        }

        return days;
    }

    private (string State, string? SourceId, bool IsStaffSchedule) ResolveBaseRotationState(DateTime date, string staffId, string teamId, List<Timeline> timelines)
    {
        Timeline? staffRotation = GetApplicableTimeline(timelines, staffId, isTeam: false, date);
        if (staffRotation != null && date >= staffRotation.StartDate.Date)
        {
            int cycleLength = staffRotation.DaysOn + staffRotation.DaysOff;
            int dayInCycle = (date - staffRotation.StartDate.Date).Days % cycleLength;
            if (dayInCycle >= staffRotation.DaysOn) return ("OffDuty", staffRotation.TimelineId, true);
            return ("Work", staffRotation.TimelineId, true);
        }

        Timeline? teamRotation = GetApplicableTimeline(timelines, teamId, isTeam: true, date);
        if (teamRotation != null && date >= teamRotation.StartDate.Date)
        {
            int cycleLength = teamRotation.DaysOn + teamRotation.DaysOff;
            int dayInCycle = (date - teamRotation.StartDate.Date).Days % cycleLength;
            if (dayInCycle >= teamRotation.DaysOn) return ("OffDuty", teamRotation.TimelineId, false);
            return ("Work", teamRotation.TimelineId, false);
        }

        return ("NoSchedule", null, false);
    }

    private void ApplyTransitionRules(Dictionary<DateTime, (string State, string? SourceId, bool IsStaffSchedule)> baseStates)
    {
        var dates = baseStates.Keys.OrderBy(d => d).ToList();

        int i = 0;
        while (i < dates.Count)
        {
            var currentState = baseStates[dates[i]].State;
            var currentIsStaff = baseStates[dates[i]].IsStaffSchedule;

            if (currentState == "NoSchedule" || currentState == "OffDuty")
            {
                int startIdx = i;
                while (i < dates.Count && baseStates[dates[i]].State == currentState && baseStates[dates[i]].IsStaffSchedule == currentIsStaff)
                {
                    i++;
                }
                int endIdx = i - 1;
                int gapLength = endIdx - startIdx + 1;

                bool applyTransitions = false;

                if (currentState == "NoSchedule")
                {
                    string? prevSource = startIdx > 0 ? baseStates[dates[startIdx - 1]].SourceId : null;
                    string? nextSource = i < dates.Count ? baseStates[dates[i]].SourceId : null;
                    if (prevSource != null && nextSource != null && prevSource != nextSource)
                    {
                        applyTransitions = true;
                    }
                }
                else if (currentState == "OffDuty")
                {
                    applyTransitions = true;
                }

                if (applyTransitions)
                {
                    if (gapLength == 1)
                    {
                        UpdateDayState(baseStates, dates[startIdx], "Transition");
                    }
                    else if (gapLength == 2)
                    {
                        UpdateDayState(baseStates, dates[startIdx], "Transition");
                        UpdateDayState(baseStates, dates[endIdx], "Transition");
                    }
                    else
                    {
                        UpdateDayState(baseStates, dates[startIdx], "Transition");
                        UpdateDayState(baseStates, dates[endIdx], "Transition");
                        for (int j = startIdx + 1; j < endIdx; j++)
                        {
                            UpdateDayState(baseStates, dates[j], "OffDuty");
                        }
                    }
                }
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

        if (activeTicket != null)
        {
            if (activeTicket.Type == TicketType.On)
                return ("Work", null, baseState.SourceId, baseState.IsStaffSchedule);

            var ticketStart = activeTicket.StartDate.Date;
            var ticketEnd = activeTicket.EndDate.Date;
            var label = activeTicket.Reason ?? activeTicket.Title;

            if (date == ticketStart || date == ticketEnd)
                return ("Transition", label, baseState.SourceId, baseState.IsStaffSchedule);

            return ("Leave", label, baseState.SourceId, baseState.IsStaffSchedule);
        }

        return (baseState.State, null, baseState.SourceId, baseState.IsStaffSchedule);
    }

    private void UpdateDayState(Dictionary<DateTime, (string State, string? SourceId, bool IsStaffSchedule)> states, DateTime date, string newState)
    {
        var current = states[date];
        states[date] = (newState, current.SourceId, current.IsStaffSchedule);
    }

    private static Timeline? GetApplicableTimeline(List<Timeline> timelines, string targetId, bool isTeam, DateTime date)
    {
        return timelines
            .Where(t => (isTeam ? t.TeamId == targetId : t.StaffId == targetId))
            .Where(t => t.StartDate.Date <= date.Date && (!t.EndDate.HasValue || t.EndDate.Value.Date >= date.Date))
            .OrderByDescending(t => t.StartDate)
            .FirstOrDefault();
    }

    public async Task<Timeline> CreateTimelineAsync(CreateTimelineRequest request, string? actorStaffId)
    {
        bool hasTeam = !string.IsNullOrEmpty(request.TeamId);
        bool hasStaff = !string.IsNullOrEmpty(request.StaffId);

        if (!hasTeam && !hasStaff)
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        if (hasTeam && hasStaff)
            throw new ArgumentException("Provide only one of TeamId or StaffId, not both.");

        if (request.EndDate.HasValue && request.EndDate.Value.Date < request.StartDate.Date)
            throw new ArgumentException("EndDate cannot be earlier than StartDate.");

        if (request.DaysOn < 1 || request.DaysOff < 1)
            throw new ArgumentException("DaysOn and DaysOff must be greater than or equal to 1.");

        var existingTimelines = await _repository.GetTimelinesByTargetAsync(request.TeamId, request.StaffId);
        var overlappingSchedule = existingTimelines.FirstOrDefault(t =>
            t.StartDate.Date <= (request.EndDate?.Date ?? DateTime.MaxValue.Date) &&
            (t.EndDate?.Date ?? DateTime.MaxValue.Date) >= request.StartDate.Date
        );

        if (overlappingSchedule != null)
        {
            throw new ArgumentException($"Jadwal bertabrakan! Sudah ada jadwal aktif dari {overlappingSchedule.StartDate:yyyy-MM-dd}. Akhiri atau hapus jadwal lama terlebih dahulu.");
        }

        var openTimeline = existingTimelines.FirstOrDefault(t => t.EndDate == null);
        if (openTimeline != null && request.StartDate.Date > openTimeline.StartDate.Date)
        {
            openTimeline.EndDate = request.StartDate.Date.AddDays(-1);
            await _repository.UpdateTimelineAsync(openTimeline);
        }

        var newTimeline = new Timeline
        {
            TimelineId = Guid.NewGuid().ToString(),
            TeamId = request.TeamId,
            StaffId = request.StaffId,
            StartDate = request.StartDate.Date,
            DaysOn = request.DaysOn,
            DaysOff = request.DaysOff,
            EndDate = request.EndDate?.Date
        };

        var created = await _repository.CreateTimelineAsync(newTimeline);

        var staff = hasStaff ? await _staffRepository.GetByIdAsync(request.StaffId!) : null;
        var team = hasTeam ? await _teamRepository.GetByIdAsync(request.TeamId!) : null;
        await _activityLogService.LogScheduleCreatedAsync(created, staff, team, actorStaffId);

        return created;
    }

    public async Task<List<TimelineHistoryResponse>> GetTimelineHistoryAsync(string? teamId, string? staffId)
    {
        if (string.IsNullOrEmpty(teamId) && string.IsNullOrEmpty(staffId))
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        if (!string.IsNullOrEmpty(teamId) && !string.IsNullOrEmpty(staffId))
            throw new ArgumentException("Provide only one of TeamId or StaffId, not both.");

        var timelines = await _repository.GetTimelinesByTargetAsync(teamId, staffId);
        var today = DateTime.UtcNow.Date;

        return timelines.OrderByDescending(t => t.StartDate).Select(t =>
        {
            string status = "Historical";
            if (t.StartDate.Date <= today && (!t.EndDate.HasValue || t.EndDate.Value.Date >= today))
                status = "Active";
            else if (t.StartDate.Date > today)
                status = "Future";

            return new TimelineHistoryResponse
            {
                TimelineId = t.TimelineId,
                TeamId = t.TeamId,
                StaffId = t.StaffId,
                StartDate = t.StartDate.ToString("yyyy-MM-dd"),
                EndDate = t.EndDate?.ToString("yyyy-MM-dd"),
                DaysOn = t.DaysOn,
                DaysOff = t.DaysOff,
                Status = status
            };
        }).ToList();
    }

    public async Task EndActiveTimelineAsync(EndTimelineRequest request, string? actorStaffId)
    {
        bool hasTeam = !string.IsNullOrEmpty(request.TeamId);
        bool hasStaff = !string.IsNullOrEmpty(request.StaffId);

        if (!hasTeam && !hasStaff)
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        if (hasTeam && hasStaff)
            throw new ArgumentException("Provide only one of TeamId or StaffId, not both.");

        var existingTimelines = await _repository.GetTimelinesByTargetAsync(request.TeamId, request.StaffId);
        var openTimeline = existingTimelines.FirstOrDefault(t => t.EndDate == null);

        if (openTimeline == null)
            throw new ArgumentException("No active open-ended schedule exists for this target.");

        if (request.EffectiveEndDate.Date < openTimeline.StartDate.Date)
            throw new ArgumentException("The EffectiveEndDate cannot be earlier than the schedule's StartDate.");

        openTimeline.EndDate = request.EffectiveEndDate.Date;
        await _repository.UpdateTimelineAsync(openTimeline);

        var staff = !string.IsNullOrEmpty(request.StaffId) ? await _staffRepository.GetByIdAsync(request.StaffId) : null;
        var team = !string.IsNullOrEmpty(request.TeamId) ? await _teamRepository.GetByIdAsync(request.TeamId) : null;
        await _activityLogService.LogScheduleChangedAsync(openTimeline, staff, team, actorStaffId, $"Ended active schedule effective {request.EffectiveEndDate:yyyy-MM-dd}");
    }
    public async Task UpdateTimelineAsync(string timelineId, UpdateTimelineRequest request, string? actorStaffId)
    {
        var timeline = await _repository.GetTimelineByIdAsync(timelineId);
        if (timeline == null)
        {
            throw new ArgumentException("Schedule not found.");
        }

        if (request.EndDate.HasValue && request.EndDate.Value.Date < request.StartDate.Date)
            throw new ArgumentException("EndDate cannot be earlier than StartDate.");

        if (request.DaysOn < 1 || request.DaysOff < 1)
            throw new ArgumentException("DaysOn and DaysOff must be greater than or equal to 1.");

        timeline.DaysOn = request.DaysOn;
        timeline.DaysOff = request.DaysOff;
        timeline.StartDate = request.StartDate.Date;
        timeline.EndDate = request.EndDate?.Date;

        await _repository.UpdateTimelineAsync(timeline);

        var staff = !string.IsNullOrEmpty(timeline.StaffId) ? await _staffRepository.GetByIdAsync(timeline.StaffId) : null;
        var team = !string.IsNullOrEmpty(timeline.TeamId) ? await _teamRepository.GetByIdAsync(timeline.TeamId) : null;
        await _activityLogService.LogScheduleChangedAsync(timeline, staff, team, actorStaffId, "Updated timeline schedule configuration");
    }

    public async Task DeleteTimelineAsync(string timelineId, string? actorStaffId)
    {
        var timeline = await _repository.GetTimelineByIdAsync(timelineId);
        if (timeline == null)
        {
            throw new ArgumentException("Schedule not found.");
        }

        var staff = !string.IsNullOrEmpty(timeline.StaffId) ? await _staffRepository.GetByIdAsync(timeline.StaffId) : null;
        var team = !string.IsNullOrEmpty(timeline.TeamId) ? await _teamRepository.GetByIdAsync(timeline.TeamId) : null;

        await _repository.DeleteTimelineAsync(timelineId);

        await _activityLogService.LogScheduleDeletedAsync(staff, team, actorStaffId);
    }
}