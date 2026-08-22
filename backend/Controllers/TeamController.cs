using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Services.Interfaces;


namespace SchedulingMeruap.Api.Controllers
{
    [Authorize] // 👈 Base requirement: Must be logged in
    [Route("api/teams")]
    [ApiController]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        // Helper to get the logged-in user
        private string? GetCurrentActorId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // =========================================================
        // VIEWING (Open to Staff, Supervisor, Admin)
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> GetTeams()
        {
            try
            {
                var result = await _teamService.GetTeamsForManagementAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load teams", details = ex.Message });
            }
        }

        // =========================================================
        // EDITING (Strictly locked to Admin ONLY)
        // =========================================================
        [HttpPost]
        [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
        public async Task<IActionResult> CreateTeam([FromBody] TeamRequest dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var actorId = GetCurrentActorId();
                var result = await _teamService.CreateTeamAsync(dto, actorId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create team", details = ex.Message });
            }
        }

        [HttpPut("{teamId}")]
        [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
        public async Task<IActionResult> EditTeam(string teamId, [FromBody] TeamRequest dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var actorId = GetCurrentActorId();
                await _teamService.UpdateTeamAsync(teamId, dto.TeamName, actorId);
                return Ok(new { message = "Team updated successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update team", details = ex.Message });
            }
        }

        [HttpDelete("{teamId}")]
        [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
        public async Task<IActionResult> DeleteTeam(string teamId)
        {
            try
            {
                var actorId = GetCurrentActorId();
                await _teamService.DeleteTeamAsync(teamId, actorId);
                return Ok(new { message = "Team deleted successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}