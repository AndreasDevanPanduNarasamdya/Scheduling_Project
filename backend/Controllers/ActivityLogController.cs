using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Services.Interfaces;

namespace SchedulingMeruap.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ActivityLogController : ControllerBase
{
    private readonly IActivityLogService _activityLogService;

    public ActivityLogController(IActivityLogService activityLogService)
    {
        _activityLogService = activityLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? staffId,
        [FromQuery] string? teamId)
    {
        var logs = await _activityLogService.GetLogsAsync(startDate, endDate, staffId, teamId);
        return Ok(logs);
    }
}