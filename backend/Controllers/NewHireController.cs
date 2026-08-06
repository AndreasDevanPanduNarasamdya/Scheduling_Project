using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.DTO.Requests;
using System;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class NewHireController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NewHireController(ApplicationDbContext context)
    {
        _context = context;
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
}