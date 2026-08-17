using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Services.Interfaces;


namespace SchedulingMeruap.Api.Controllers
{
    [Authorize]
    [Route("api/teams")] // Explicitly matches the plural route your frontend expects
    [ApiController]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
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
                var result = await _teamService.CreateTeamAsync(dto);
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
        [HttpDelete("{teamId}")]
        public async Task<IActionResult> DeleteTeam(string teamId)
        {
            try
            {
                await _teamService.DeleteTeamAsync(teamId);
                return Ok(new { message = "Team deleted successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}