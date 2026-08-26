using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Services.Interfaces;

namespace SchedulingMeruap.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IStaffService _staffService;

    public AuthController(IAuthService authService, IStaffService staffService)
    {
        _authService = authService;
        _staffService = staffService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        var loginResult = await _authService.LoginAsync(request);

        if (loginResult is null)
            return Unauthorized(new { message = "Invalid credentials" });

        // Unpack the tuple directly
        var (user, token) = loginResult.Value;

        var staff = await _staffService.GetByUserIdAsync(user.UserId);

        return Ok(new
        {
            token,
            user.UserId,
            user.Email,
            clearance = (int)user.Clearance,
            staffId = staff?.StaffId,
            staff?.FirstName,
            staff?.LastName,
            staff?.Position
        });
    }
}