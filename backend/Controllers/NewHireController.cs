using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Services.Interfaces;
using System;
using System.Threading.Tasks;
using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NewHireController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly INewHireService _newHireService;

    public NewHireController(ApplicationDbContext context, INewHireService newHireService)
    {
        _context = context;
        _newHireService = newHireService;
    }

    // =========================================================
    // MANAGEMENT (Strictly locked to Admin ONLY)
    // =========================================================
    [HttpPost("new-hire")]
    [Authorize(Roles = "2")]
    public async Task<IActionResult> AddNewHire([FromBody] NewHireRequest request)
    {
        string generatedToken = Guid.NewGuid().ToString();

        // 🔥 OPTIMIZATION: Target-typed new() and direct Guid generation
        NewHire newHire = new()
        {
            NewHireId = Guid.NewGuid().ToString(),
            ActivationToken = generatedToken,
            TokenExpiry = DateTime.UtcNow.AddHours(48),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Sex = request.Sex,
            Position = request.Position,
            Email = request.Email,
            Phone = request.Phone,
            Dob = request.Dob,
            JoinDate = request.JoinDate
        };

        _context.NewHires.Add(newHire);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Staff added to staging successfully",
            tokenId = generatedToken
        });
    }

    // =========================================================
    // ACCOUNT ACTIVATION (Open to the public/unauthenticated users)
    // =========================================================

    [AllowAnonymous]
    [HttpGet("activate/validate")]
    public async Task<IActionResult> ValidateActivationToken([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Ok(new NewHireResponse { Status = "invalid" });

        // 🔥 OPTIMIZATION: Direct return
        return Ok(await _newHireService.ValidateTokenAsync(token));
    }

    [AllowAnonymous]
    [HttpPost("activate")]
    public async Task<IActionResult> ActivateAccount([FromBody] ActivateAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return BadRequest(new { message = "Password minimal 8 karakter." });

        var success = await _newHireService.ActivateAccountAsync(request.Token, request.Password);

        if (!success)
            return BadRequest(new { message = "Token tidak valid atau sudah kedaluwarsa." });

        return Ok(new { message = "Akun berhasil diaktifkan." });
    }
}