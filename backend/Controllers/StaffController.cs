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

    // 🔥 1. Add the helper to get the logged-in user
    private string? GetCurrentActorId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var staff = await _staffService.GetAllAsync();
        return Ok(staff);
    }

    [HttpGet("{staffId}")]
    public async Task<IActionResult> GetById(string staffId)
    {
        var staff = await _staffService.GetByIdAsync(staffId);
        if (staff == null) return NotFound();
        return Ok(staff);
    }

    [HttpGet("unassigned")]
    public async Task<IActionResult> GetUnassignedStaff()
    {
        var unassigned = await _staffService.GetUnassignedStaffAsync();
        return Ok(unassigned);
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignStaff([FromBody] StaffRequest dto)
    {
        var success = await _staffService.AssignStaffAsync(dto);

        if (!success) return NotFound(new { message = "Staff member not found" });

        return Ok(new { message = "Staff assigned successfully!" });
    }

    // 🔥 2. Update Edit Staff Endpoint
    [HttpPut("{staffId}")]
    public async Task<IActionResult> EditStaff(string staffId, [FromBody] UpdateStaffRequest request)
    {
        try
        {
            var actorId = GetCurrentActorId(); // 🔥 Grab the admin editing the staff
            await _staffService.UpdateStaffAsync(staffId, request, actorId); // 🔥 Pass it down
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

    // 🔥 3. Update Delete Staff Endpoint
    [HttpDelete("{staffId}")]
    public async Task<IActionResult> DeleteStaff(string staffId)
    {
        try
        {
            var actorId = GetCurrentActorId(); // 🔥 Grab the admin deleting the staff
            await _staffService.DeleteStaffAsync(staffId, actorId); // 🔥 Pass it down
            return Ok(new { message = "Staff deleted successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}