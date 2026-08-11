using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.DTO.Requests;

namespace SchedulingMeruap.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TimelineController : ControllerBase
    {
        private readonly ITimelineService _timelineService;

        public TimelineController(ITimelineService timelineService)
        {
            _timelineService = timelineService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTimeline([FromQuery] TimelineRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var data = await _timelineService.GetTimelineDataAsync(request);
            return Ok(data);
        }

        // Add this missing block right here!
        [HttpPost]
        public async Task<IActionResult> CreateTimeline([FromBody] CreateTimelineRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _timelineService.CreateTimelineAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
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
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("end")]
        public async Task<IActionResult> EndTimeline([FromBody] EndTimelineRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                await _timelineService.EndActiveTimelineAsync(request);
                return Ok(new { message = "Schedule successfully closed." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}