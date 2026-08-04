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
    public async Task<IActionResult> Login(AuthRequest request)
    {
        var loginResult = await _authService.LoginAsync(request);

        if (loginResult == null)
            return Unauthorized(new { message = "Invalid credentials" });

        var user = loginResult.Value.User;
        var token = loginResult.Value.Token;
        var staff = await _staffService.GetByUserIdAsync(user.UserId);

        return Ok(new
        {
            token,
            user.UserId,
            user.Email,
            staffId = staff?.StaffId,
            staff?.FirstName,
            staff?.LastName,
            staff?.Position
        });
    }
}