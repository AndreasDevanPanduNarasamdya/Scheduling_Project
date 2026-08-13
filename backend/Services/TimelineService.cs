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
        var activeTimelines = await _repository.GetActiveTimelinesAsync(request.StartDate, request.EndDate);
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
                    Days = new List<TimelineDayResponse>()
                };

                for (var date = request.StartDate.Date; date <= request.EndDate.Date; date = date.AddDays(1))
                {
                    string barType = "None";

                    Timeline? rotation = null;
                    if (staffTeam.FollowsTeamSchedule)
                    {
                        rotation = GetApplicableTimeline(activeTimelines, team.TeamId, isTeam: true, date);
                    }
                    else
                    {
                        rotation = GetApplicableTimeline(activeTimelines, staff.StaffId, isTeam: false, date);
                    }

                    // 2. Base Rotation Math
                    if (rotation != null && date >= rotation.StartDate.Date)
                    {
                        int cycleLength = rotation.DaysOn + rotation.DaysOff;
                        int daysSinceStart = (date - rotation.StartDate.Date).Days;
                        int dayInCycle = daysSinceStart % cycleLength;

                        if (dayInCycle >= rotation.DaysOn)
                        {
                            // NEW LOGIC: Check if it's the FIRST day off or the LAST day off
                            if (dayInCycle == rotation.DaysOn || dayInCycle == cycleLength - 1)
                            {
                                barType = "Transition"; // Airport Pickup (Yellow)
                            }
                            else
                            {
                                barType = "OffDuty"; // Normal Break (Blue)
                            }
                        }
                    }

                    // 3. Ticket Overrides (Exceptions take precedence over base rotation)
                    var activeTicket = staff.Tickets.FirstOrDefault(t =>
                        t.Status == TicketStatus.Approved &&
                        date >= t.StartDate.Date && date <= t.EndDate.Date);

                    if (activeTicket != null)
                    {
                        if (activeTicket.Type == TicketType.Off)
                        {
                            var ticketStart = activeTicket.StartDate.Date;
                            var ticketEnd = activeTicket.EndDate.Date;

                            // Tickets ALSO get the airport pickup treatment at start and end!
                            barType = (date == ticketStart || date == ticketEnd) ? "Transition" : "Leave";
                        }
                        else if (activeTicket.Type == TicketType.On)
                        {
                            barType = "None"; // Force back to working
                        }
                    }

                    if (barType != "None")
                    {
                        staffDto.Days.Add(new TimelineDayResponse
                        {
                            Date = date.ToString("yyyy-MM-dd"),
                            BarType = barType,
                            Label = activeTicket?.Reason
                        });
                    }
                }

                teamDto.Members.Add(staffDto);
            }
            response.Add(teamDto);
        }

        return response;
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
        // Validation: Exactly one target must be specified
        bool hasTeam = !string.IsNullOrEmpty(request.TeamId);
        bool hasStaff = !string.IsNullOrEmpty(request.StaffId);

        if (request.EndDate.HasValue && request.EndDate.Value.Date < request.StartDate.Date)
            throw new ArgumentException("EndDate cannot be earlier than StartDate.");

        if (!hasTeam && !hasStaff)
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        if (hasTeam && hasStaff)
            throw new ArgumentException("Provide only one of TeamId or StaffId, not both.");

        if (request.DaysOn < 1 || request.DaysOff < 1)
            throw new ArgumentException("DaysOn and DaysOff must be greater than or equal to 1.");

        // Validation: Ensure entity exists in the database
        if (hasTeam && !await _repository.TeamExistsAsync(request.TeamId!))
            throw new ArgumentException($"Team with ID '{request.TeamId}' does not exist.");
        if (hasStaff && !await _repository.StaffExistsAsync(request.StaffId!))
            throw new ArgumentException($"Staff with ID '{request.StaffId}' does not exist.");

        // Handle Versioning & Overlap Prevention
        var existingTimelines = await _repository.GetTimelinesByTargetAsync(request.TeamId, request.StaffId);
        var openTimeline = existingTimelines.FirstOrDefault(t => t.EndDate == null);

        if (openTimeline != null)
        {
            if (request.StartDate.Date <= openTimeline.StartDate.Date)
            {
                throw new ArgumentException("New timeline StartDate must be chronologically after the current schedule's StartDate.");
            }

            // Automatically close the existing schedule version the day before the new one starts
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

        if (hasStaff)
        {
            await _repository.SetFollowsTeamScheduleAsync(request.StaffId!, followsTeam: false);
        }

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
            {
                status = "Active";
            }
            else if (t.StartDate.Date > today)
            {
                status = "Future";
            }

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