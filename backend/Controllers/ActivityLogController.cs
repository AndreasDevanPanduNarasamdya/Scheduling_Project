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

    // =========================================================
    // VIEWING (Locked for Staff, Open to Supervisor & Admin)
    // =========================================================
    [HttpGet]
    [Authorize(Roles = "2,1")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? staffId,
        [FromQuery] string? teamId)
    {
        try
        {
            var logs = await _activityLogService.GetLogsAsync(startDate, endDate, staffId, teamId);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Gagal mengambil log aktivitas.", details = ex.Message });
        }
    }
}