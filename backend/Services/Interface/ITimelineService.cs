using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITimelineService
{
    Task<List<TimelineTeamResponse>> GetTimelineDataAsync(TimelineRequest request);
    Task<Timeline> CreateTimelineAsync(CreateTimelineRequest request, string? actorStaffId);
    Task<List<TimelineHistoryResponse>> GetTimelineHistoryAsync(string? teamId, string? staffId);
    Task EndActiveTimelineAsync(EndTimelineRequest request, string? actorStaffId);
    Task UpdateTimelineAsync(string timelineId, UpdateTimelineRequest request, string? actorStaffId);
    Task DeleteTimelineAsync(string timelineId, string? actorStaffId);
}