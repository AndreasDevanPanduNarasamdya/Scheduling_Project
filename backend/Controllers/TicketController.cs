using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Data;
using System.Security.Claims;

namespace SchedulingMeruap.Api.Controllers;

[Authorize] // Base requirement: Must be logged in
[ApiController]
[Route("api/[controller]")]
public class TicketController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    // Helper to get the logged-in user from the JWT token
    private string? GetCurrentActorId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    // =========================================================
    // INBOX VIEWING (Staff locked out, Supervisor/Admin only)
    // =========================================================
    [HttpGet]
    [Authorize(Roles = "Admin,Supervisor")] // 🔥 Lock out Level 0 Staff
    public async Task<IActionResult> GetAllTickets()
    {
        try
        {
            var tickets = await _ticketService.GetAllTicketsAsync();

            var response = tickets.Select(t => new TicketResponse
            {
                TicketID = t.TicketId,
                FirstName = t.Staff?.FirstName ?? "Unknown",
                LastName = t.Staff?.LastName ?? "",
                Role = t.Staff?.Position ?? "Staff",
                Team = "Tim A",
                Type = t.Type,
                Title = t.Title,
                Description = t.Description,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                Status = t.Status
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving tickets", details = ex.Message });
        }
    }

    // =========================================================
    // PENGAJUAN (Free for All - Staff, Supervisor, Admin)
    // =========================================================
    [HttpPost("{userId}")]
    // No role restriction needed here!
    public async Task<IActionResult> SubmitTicket(string userId, [FromBody] SubmitTicketRequest request)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(new { message = "User ID is required." });
        }

        try
        {
            var actorId = GetCurrentActorId();
            var ticket = await _ticketService.SubmitTicketAsync(request, userId, actorId);

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

    // =========================================================
    // INBOX EDITING (Admin ONLY)
    // =========================================================
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
    public async Task<IActionResult> ApproveTicket(string id, [FromBody] TicketActionRequest request)
    {
        try
        {
            var actorId = GetCurrentActorId();
            await _ticketService.ApproveTicketAsync(id, request.Reason, actorId);
            return Ok(new { message = "Ticket approved successfully" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin")] // 🔥 STRICT LOCK
    public async Task<IActionResult> RejectTicket(string id, [FromBody] TicketActionRequest request)
    {
        try
        {
            var actorId = GetCurrentActorId();
            await _ticketService.RejectTicketAsync(id, request.Reason, actorId);
            return Ok(new { message = "Ticket rejected successfully" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}