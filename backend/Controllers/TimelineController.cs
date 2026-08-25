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

    // 🔥 OPTIMIZATION: Expression-bodied helper
    private string? GetCurrentActorId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    // =========================================================
    // VIEWING ENDPOINTS (Allowed for Staff, Supervisor, Admin)
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetTimeline([FromQuery] TimelineRequest request)
    {
        // 🔥 OPTIMIZATION: Removed ModelState.IsValid block (handled by [ApiController])

        if (request.StartDate == default)
        {
            request.StartDate = new DateTime(DateTime.UtcNow.Year, 1, 1);
        }
        if (request.EndDate == default)
        {
            request.EndDate = new DateTime(DateTime.UtcNow.Year, 12, 31);
        }

        // 🔥 OPTIMIZATION: Direct return
        return Ok(await _timelineService.GetTimelineDataAsync(request));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetTimelineHistory([FromQuery] string? teamId, [FromQuery] string? staffId)
    {
        try
        {
            // 🔥 OPTIMIZATION: Direct return
            return Ok(await _timelineService.GetTimelineHistoryAsync(teamId, staffId));
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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateTimeline([FromBody] CreateTimelineRequest request)
    {
        try
        {
            // 🔥 OPTIMIZATION: Inlined ActorId
            await _timelineService.CreateTimelineAsync(request, GetCurrentActorId());
            return Ok(new { message = "Jadwal berhasil dibuat." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("end")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> EndTimeline([FromBody] EndTimelineRequest request)
    {
        try
        {
            await _timelineService.EndActiveTimelineAsync(request, GetCurrentActorId());
            return Ok(new { message = "Schedule successfully closed." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{timelineId}")]
    [Authorize(Roles = "Admin")]
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
    [Authorize(Roles = "Admin")]
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
}