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

    [HttpPost("new-hire")]
    public async Task<IActionResult> AddNewHire([FromBody] NewHireRequest request)
    {
        // 1. Generate the security token and ID
        string generatedToken = Guid.NewGuid().ToString();
        string generatedId = Guid.NewGuid().ToString();

        // 2. Map the incoming React data to your Database Model
        var newHire = new NewHire
        {
            NewHireId = generatedId,
            ActivationToken = generatedToken,
            TokenExpiry = DateTime.Now.AddHours(48), // Token valid for 2 days

            FirstName = request.FirstName,
            LastName = request.LastName,
            Sex = request.Sex,
            Position = request.Position,
            Email = request.Email,
            Phone = request.Phone,
            Dob = request.Dob,
            JoinDate = request.JoinDate
        };

        // 3. Save to the NEW_HIRE database table
        _context.NewHires.Add(newHire);
        await _context.SaveChangesAsync();

        // 4. (Future Step) Here is where you would send the email to request.Email 
        // with a link like: https://yourfrontend.com/activate?token=generatedToken

        return Ok(new
        {
            message = "Staff added to staging successfully",
            tokenId = generatedToken // Returning this just for testing purposes!
        });
    }

    [AllowAnonymous]
    [HttpGet("activate/validate")]
    public async Task<IActionResult> ValidateActivationToken([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Ok(new NewHireResponse { Status = "invalid" });

        var response = await _newHireService.ValidateTokenAsync(token);

        // This will send back JSON like: { "status": "valid", "name": "Andreas Devan" }
        return Ok(response);
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