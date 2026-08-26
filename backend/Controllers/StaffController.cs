using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Services.Interfaces;

namespace SchedulingMeruap.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    private string? GetCurrentActorId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _staffService.GetAllAsync()); // 🔥 OPTIMIZATION: Direct return

    [HttpGet("{staffId}")]
    public async Task<IActionResult> GetById(string staffId)
    {
        var staff = await _staffService.GetByIdAsync(staffId);
        return staff is null ? NotFound() : Ok(staff);
    }

    [HttpGet("unassigned")]
    public async Task<IActionResult> GetUnassignedStaff() =>
        Ok(await _staffService.GetUnassignedStaffAsync());

    [HttpPost("assign")]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> AssignStaff([FromBody] StaffRequest dto)
    {
        var success = await _staffService.AssignStaffAsync(dto, GetCurrentActorId());

        return success
            ? Ok(new { message = "Staff assigned successfully!" })
            : NotFound(new { message = "Staff member not found" });
    }

    [HttpPut("{staffId}")]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> EditStaff(string staffId, [FromBody] UpdateStaffRequest request)
    {
        try
        {
            await _staffService.UpdateStaffAsync(staffId, request, GetCurrentActorId());
            return Ok(new { message = "Staff updated successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while updating the staff member." });
        }
    }

    [HttpDelete("{staffId}")]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> DeleteStaff(string staffId)
    {
        try
        {
            await _staffService.DeleteStaffAsync(staffId, GetCurrentActorId());
            return Ok(new { message = "Staff deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}