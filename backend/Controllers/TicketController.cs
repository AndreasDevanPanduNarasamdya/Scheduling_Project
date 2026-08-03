using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.DTO.Responses;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpPost("{userId}")]
    public async Task<IActionResult> SubmitTicket(string userId, [FromBody] SubmitTicketRequest request)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(new { message = "User ID is required." });
        }

        try
        {
            var ticket = await _ticketService.SubmitTicketAsync(request, userId);

            return Ok(new
            {
                message = "Ticket successfully created",
                ticketId = ticket.TicketId
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Database error",
                details = ex.Message
            });
        }
    }
}