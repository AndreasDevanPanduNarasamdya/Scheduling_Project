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


namespace SchedulingMeruap.Api.Controllers
{
    [Authorize] // 👈 Base requirement: Must be logged in (Staff, Supervisor, Admin)
    [ApiController]
    [Route("api/[controller]")]
    public class TimelineController : ControllerBase
    {
        private readonly ITimelineService _timelineService;

        public TimelineController(ITimelineService timelineService)
        {
            _timelineService = timelineService;
        }

        private string? GetCurrentActorId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // =========================================================
        // VIEWING ENDPOINTS (Allowed for Staff, Supervisor, Admin)
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetTimeline([FromQuery] TimelineRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.StartDate == default)
            {
                request.StartDate = new DateTime(DateTime.UtcNow.Year, 1, 1);
            }
            if (request.EndDate == default)
            {
                request.EndDate = new DateTime(DateTime.UtcNow.Year, 12, 31);
            }

            var data = await _timelineService.GetTimelineDataAsync(request);
            return Ok(data);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetTimelineHistory([FromQuery] string? teamId, [FromQuery] string? staffId)
        {
            try
            {
                var history = await _timelineService.GetTimelineHistoryAsync(teamId, staffId);
                return Ok(history);
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
        [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
        public async Task<IActionResult> CreateTimeline([FromBody] CreateTimelineRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var actorId = GetCurrentActorId();
                var result = await _timelineService.CreateTimelineAsync(request, actorId);
                return Ok(new { message = "Jadwal berhasil dibuat." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("end")]
        [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
        public async Task<IActionResult> EndTimeline([FromBody] EndTimelineRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var actorId = GetCurrentActorId();
                await _timelineService.EndActiveTimelineAsync(request, actorId);
                return Ok(new { message = "Schedule successfully closed." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{timelineId}")]
        [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
        public async Task<IActionResult> UpdateTimeline(string timelineId, [FromBody] UpdateTimelineRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var actorId = GetCurrentActorId();
                await _timelineService.UpdateTimelineAsync(timelineId, request, actorId);
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
        [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
        public async Task<IActionResult> DeleteTimeline(string timelineId)
        {
            try
            {
                var actorId = GetCurrentActorId();
                await _timelineService.DeleteTimelineAsync(timelineId, actorId);
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
}