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

    public TimelineService(ITimelineRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<TimelineTeamResponse>> GetTimelineDataAsync(TimelineRequest request)
    {
        var teamsData = await _repository.GetTeamsWithStaffAndTicketsAsync();
        var activeTimelines = await _repository.GetActiveTimelinesAsync(
            request.StartDate.AddDays(-5),
            request.EndDate.AddDays(5)
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
                    Days = BuildTimelineDayResponses(staff, team, activeTimelines, request.StartDate, request.EndDate)
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

        // STAGE 1: Calculate pure base states (Tracking IsStaffSchedule to apply personal transition rules)
        var baseStates = new Dictionary<DateTime, (string State, string? SourceId, bool IsStaffSchedule)>();

        for (var date = queryStart; date <= queryEnd; date = date.AddDays(1))
        {
            baseStates[date] = ResolveBaseRotationState(date, staff.StaffId, team.TeamId, activeTimelines);
        }

        // STAGE 2: Apply Transition rules BEFORE tickets
        ApplyTransitionRules(baseStates);

        // STAGE 3: Apply Tickets and map to final UI response
        var days = new List<TimelineDayResponse>();
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var dayData = baseStates[date];
            var finalState = ApplyTicketOverride(date, dayData, staff.Tickets);

            // Omit Work and untreated NoSchedule from the final UI payload
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
        // 1. Check for an applicable Staff schedule
        Timeline? staffRotation = GetApplicableTimeline(timelines, staffId, isTeam: false, date);
        if (staffRotation != null && date >= staffRotation.StartDate.Date)
        {
            int cycleLength = staffRotation.DaysOn + staffRotation.DaysOff;
            int dayInCycle = (date - staffRotation.StartDate.Date).Days % cycleLength;
            if (dayInCycle >= staffRotation.DaysOn) return ("OffDuty", staffRotation.TimelineId, true);
            return ("Work", staffRotation.TimelineId, true);
        }

        // 2. Fallback to Team schedule
        Timeline? teamRotation = GetApplicableTimeline(timelines, teamId, isTeam: true, date);
        if (teamRotation != null && date >= teamRotation.StartDate.Date)
        {
            int cycleLength = teamRotation.DaysOn + teamRotation.DaysOff;
            int dayInCycle = (date - teamRotation.StartDate.Date).Days % cycleLength;
            if (dayInCycle >= teamRotation.DaysOn) return ("OffDuty", teamRotation.TimelineId, false);
            return ("Work", teamRotation.TimelineId, false);
        }

        // 3. No schedule exists
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

            // Target 1: Empty boundary gaps (NoSchedule)
            // Target 2: Normal OffDuty blocks belonging specifically to Staff schedules
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
                    // Applies to ANY off period — team-sourced or staff-sourced alike (rule 5/6)
                    applyTransitions = true;
                }

                if (applyTransitions)
                {
                    if (gapLength == 1)
                    {
                        // A single-day break is entirely a transition (start and end collapse into one day)
                        UpdateDayState(baseStates, dates[startIdx], "Transition");
                    }
                    else if (gapLength == 2)
                    {
                        // Both days become transition — no room for a "true" middle off day
                        UpdateDayState(baseStates, dates[startIdx], "Transition");
                        UpdateDayState(baseStates, dates[endIdx], "Transition");
                    }
                    else // gapLength >= 3
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

    public async Task<Timeline> CreateTimelineAsync(CreateTimelineRequest request)
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

        if (hasTeam && !await _repository.TeamExistsAsync(request.TeamId!))
            throw new ArgumentException($"Team with ID '{request.TeamId}' does not exist.");
        if (hasStaff && !await _repository.StaffExistsAsync(request.StaffId!))
            throw new ArgumentException($"Staff with ID '{request.StaffId}' does not exist.");

        var existingTimelines = await _repository.GetTimelinesByTargetAsync(request.TeamId, request.StaffId);
        var openTimeline = existingTimelines.FirstOrDefault(t => t.EndDate == null);

        if (openTimeline != null)
        {
            if (request.StartDate.Date <= openTimeline.StartDate.Date)
                throw new ArgumentException("New timeline StartDate must be chronologically after the current schedule's StartDate.");

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

        return await _repository.CreateTimelineAsync(newTimeline);
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

    public async Task EndActiveTimelineAsync(EndTimelineRequest request)
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
    }
}