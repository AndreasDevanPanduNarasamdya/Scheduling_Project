using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Services.Interfaces;


namespace SchedulingMeruap.Api.Controllers;

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

    private string? GetCurrentActorId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetTeams()
    {
        try
        {
            return Ok(await _teamService.GetTeamsForManagementAsync());
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load teams", details = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> CreateTeam([FromBody] TeamRequest dto)
    {
        try
        {
            return Ok(await _teamService.CreateTeamAsync(dto, GetCurrentActorId()));
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
    [Authorize(Roles = "2")]
    public async Task<IActionResult> EditTeam(string teamId, [FromBody] TeamRequest dto)
    {
        try
        {
            await _teamService.UpdateTeamAsync(teamId, dto.TeamName, GetCurrentActorId());
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
    [Authorize(Roles = "2")]
    public async Task<IActionResult> DeleteTeam(string teamId)
    {
        try
        {
            await _teamService.DeleteTeamAsync(teamId, GetCurrentActorId());
            return Ok(new { message = "Team deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}