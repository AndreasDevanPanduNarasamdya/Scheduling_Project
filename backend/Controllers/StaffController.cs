using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.Services.Interfaces;

namespace SchedulingMeruap.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
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
}