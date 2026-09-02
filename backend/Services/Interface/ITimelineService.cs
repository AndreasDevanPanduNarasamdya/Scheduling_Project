using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITimelineService
{
    Task<List<TimelineTeamResponse>> GetTimelineDataAsync(TimelineRequest request);
    Task<Timeline> CreateTimelineAsync(CreateTimelineRequest request, string? actorStaffId);
    Task<List<TimelineHistoryResponse>> GetTimelineHistoryAsync(string? teamId, string? staffId, bool includeHistorical = false);
    Task UpdateTimelineAsync(string timelineId, UpdateTimelineRequest request, string? actorStaffId);
    Task DeleteTimelineAsync(string timelineId, string? actorStaffId);
    Task<List<BlockedRangeResponse>> GetBlockedDateRangesAsync(string? teamId, string? staffId, string? excludeTimelineId = null);
    Task<Dictionary<string, (string Status, string? Note)>> GetCurrentStatusForStaffAsync(List<string> staffIds);
}