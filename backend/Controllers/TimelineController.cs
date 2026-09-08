using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.DTO.Requests;


namespace SchedulingMeruap.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TimelineController : ControllerBase
{
    private readonly ITimelineService _timelineService;

    public TimelineController(ITimelineService timelineService)
    {
        _timelineService = timelineService;
    }

    private string? GetCurrentActorId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetTimeline([FromQuery] TimelineRequest request)
    {
        if (request.StartDate == default)
        {
            request.StartDate = new DateTime(DateTime.UtcNow.Year, 1, 1);
        }
        if (request.EndDate == default)
        {
            request.EndDate = new DateTime(DateTime.UtcNow.Year, 12, 31);
        }
        return Ok(await _timelineService.GetTimelineDataAsync(request));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetTimelineHistory(
        [FromQuery] string? teamId,
        [FromQuery] string? staffId,
        [FromQuery] bool includeHistorical = false)
    {
        try
        {
            return Ok(await _timelineService.GetTimelineHistoryAsync(teamId, staffId, includeHistorical));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // =========================================================
    // EDITING ENDPOINTS (Strictly locked to Admin ONLY)
    // =========================================================

    [HttpPost]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> CreateTimeline([FromBody] CreateTimelineRequest request)
    {
        try
        {
            await _timelineService.CreateTimelineAsync(request, GetCurrentActorId());
            return Ok(new { message = "Jadwal berhasil dibuat." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{timelineId}")]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> UpdateTimeline(string timelineId, [FromBody] UpdateTimelineRequest request)
    {
        try
        {
            await _timelineService.UpdateTimelineAsync(timelineId, request, GetCurrentActorId());
            return Ok(new { message = "Jadwal berhasil diperbarui." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Gagal memperbarui jadwal.", details = ex.Message });
        }
    }

    [HttpDelete("{timelineId}")]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> DeleteTimeline(string timelineId)
    {
        try
        {
            await _timelineService.DeleteTimelineAsync(timelineId, GetCurrentActorId());
            return Ok(new { message = "Jadwal berhasil dihapus." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Gagal menghapus jadwal.", details = ex.Message });
        }
    }

    [HttpGet("blocked-ranges")]
    public async Task<IActionResult> GetBlockedDateRanges(
        [FromQuery] string? teamId,
        [FromQuery] string? staffId,
        [FromQuery] string? excludeTimelineId = null)
    {
        try
        {
            return Ok(await _timelineService.GetBlockedDateRangesAsync(teamId, staffId, excludeTimelineId));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpGet("debug-time")]
    public IActionResult DebugTime()
    {
        return Ok(new
        {
            UtcNow = DateTime.UtcNow,
            LocalNow = DateTime.Now,
            ServerTimeZone = TimeZoneInfo.Local.Id
        });
    }
}