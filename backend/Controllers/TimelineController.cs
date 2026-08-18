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
    [Authorize] // 🔥 IMPORTANT: This ensures only logged-in users can hit this, allowing us to read their token
    [ApiController]
    [Route("api/[controller]")]
    public class TimelineController : ControllerBase
    {
        private readonly ITimelineService _timelineService;

        public TimelineController(ITimelineService timelineService)
        {
            _timelineService = timelineService;
        }

        // 🔥 NEW HELPER: Extracts the logged-in user's ID from their Token
        private string? GetCurrentActorId()
        {
            // If your token saves the ID under a different claim, adjust this (e.g., ClaimTypes.NameIdentifier)
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        [HttpGet]
        public async Task<IActionResult> GetTimeline([FromQuery] TimelineRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Fallback to current year if dates are missing
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

        [HttpPost]
        public async Task<IActionResult> CreateTimeline([FromBody] CreateTimelineRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var actorId = GetCurrentActorId(); // 🔥 Grab the user who clicked "Save"
                var result = await _timelineService.CreateTimelineAsync(request, actorId); // 🔥 Pass it down
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                // Wrapped in a JSON object so the frontend can read errorData.message cleanly
                return BadRequest(new { message = ex.Message });
            }
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

        [HttpPost("end")]
        public async Task<IActionResult> EndTimeline([FromBody] EndTimelineRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var actorId = GetCurrentActorId(); // 🔥 Grab the user who clicked "End"
                await _timelineService.EndActiveTimelineAsync(request, actorId); // 🔥 Pass it down
                return Ok(new { message = "Schedule successfully closed." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}