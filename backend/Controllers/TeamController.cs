using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Services.Interfaces;
namespace Api.Controllers
{
    [Route("api/[controller]")]
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
            var result = await _teamService.GetTeamsForManagementAsync();
            return Ok(result);
        }
        [HttpPost]
        public async Task<IActionResult> CreateTeam([FromBody] TeamRequest dto)
        {
            var result = await _teamService.CreateTeamAsync(dto);
            return Ok(result); // Returns the new TeamResponse
        }
    }
}