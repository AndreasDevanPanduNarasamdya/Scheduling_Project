using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITimelineService
{
    Task<List<TimelineTeamResponse>> GetTimelineDataAsync(TimelineRequest request);
    Task<Timeline> CreateTimelineAsync(CreateTimelineRequest request);
}