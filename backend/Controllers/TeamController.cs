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
    [Authorize]
    [Route("api/teams")]
    [ApiController]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        // 🔥 1. Add the helper to get the logged-in user
        private string? GetCurrentActorId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

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

        [HttpPost]
        public async Task<IActionResult> CreateTeam([FromBody] TeamRequest dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var actorId = GetCurrentActorId(); // 🔥 2. Grab the admin creating the team
                var result = await _teamService.CreateTeamAsync(dto, actorId); // 🔥 3. Pass it down
                return Ok(result); // Returns the new TeamResponse
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
        public async Task<IActionResult> EditTeam(string teamId, [FromBody] TeamRequest dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var actorId = GetCurrentActorId(); // 🔥 4. Grab the admin editing the team
                await _teamService.UpdateTeamAsync(teamId, dto.TeamName, actorId); // 🔥 5. Pass it down
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
        public async Task<IActionResult> DeleteTeam(string teamId)
        {
            try
            {
                var actorId = GetCurrentActorId(); // 🔥 6. Grab the admin deleting the team
                await _teamService.DeleteTeamAsync(teamId, actorId); // 🔥 7. Pass it down
                return Ok(new { message = "Team deleted successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}