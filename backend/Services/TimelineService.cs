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

    // ---> THIS IS YOUR PERFECTED GET METHOD (Read) <---
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

                // Point 1 Fix: Respect FollowsTeamSchedule hierarchy
                Timeline rotation = null;
                if (staffTeam.FollowsTeamSchedule)
                {
                    rotation = activeTimelines.FirstOrDefault(t => t.TeamId == team.TeamId)
                            ?? activeTimelines.FirstOrDefault(t => t.StaffId == staff.StaffId);
                }
                else
                {
                    rotation = activeTimelines.FirstOrDefault(t => t.StaffId == staff.StaffId)
                            ?? activeTimelines.FirstOrDefault(t => t.TeamId == team.TeamId);
                }

                for (var date = request.StartDate.Date; date <= request.EndDate.Date; date = date.AddDays(1))
                {
                    string barType = "None";

                    // --- 1. Base Rotation Math ---
                    if (rotation != null && date >= rotation.StartDate.Date)
                    {
                        if (!rotation.EndDate.HasValue || date <= rotation.EndDate.Value.Date)
                        {
                            int cycleLength = rotation.DaysOn + rotation.DaysOff;
                            int daysSinceStart = (date - rotation.StartDate.Date).Days;
                            int dayInCycle = daysSinceStart % cycleLength;

                            if (dayInCycle >= rotation.DaysOn)
                            {
                                barType = "OffDuty";
                            }
                        }
                    }

                    // --- 2. Ticket Overrides ---
                    var activeTicket = staff.Tickets.FirstOrDefault(t =>
                        t.Status == TicketStatus.Approved &&
                        date >= t.StartDate.Date && date <= t.EndDate.Date);

                    if (activeTicket != null && activeTicket.Type == TicketType.Off)
                    {
                        var ticketStart = activeTicket.StartDate.Date;
                        var ticketEnd = activeTicket.EndDate.Date;

                        if (date == ticketStart || date == ticketEnd)
                            barType = "Transition";
                        else
                            barType = "Leave";
                    }

                    if (barType != "None")
                    {
                        staffDto.Days.Add(new TimelineDayResponse
                        {
                            Date = date.ToString("yyyy-MM-dd"),
                            BarType = barType
                        });
                    }
                }

                teamDto.Members.Add(staffDto);
            }
            response.Add(teamDto);
        }

        return response;
    }

    // ---> THIS IS THE MISSING POST METHOD (Write) <---
    public async Task<Timeline> CreateTimelineAsync(CreateTimelineRequest request)
    {
        // Validation to ensure they picked either a team or a staff member
        if (string.IsNullOrEmpty(request.TeamId) && string.IsNullOrEmpty(request.StaffId))
        {
            throw new ArgumentException("You must provide either a TeamId or a StaffId.");
        }

        var newTimeline = new Timeline
        {
            TimelineId = Guid.NewGuid().ToString(), // Assuming string ID in your DB
            TeamId = request.TeamId,
            StaffId = request.StaffId,
            StartDate = request.StartDate,
            DaysOn = request.DaysOn,
            DaysOff = request.DaysOff,
            EndDate = null // Loops infinitely until HR changes it
        };

        return await _repository.CreateTimelineAsync(newTimeline);
    }
}