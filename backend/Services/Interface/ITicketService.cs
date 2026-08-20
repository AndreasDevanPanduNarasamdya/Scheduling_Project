using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITicketService
{
    Task<Ticket> SubmitTicketAsync(SubmitTicketRequest request, string userId, string? actorStaffId);
    Task<IEnumerable<Ticket>> GetAllTicketsAsync();
    Task ApproveTicketAsync(string id, string reason, string? actorStaffId);
    Task RejectTicketAsync(string id, string reason, string? actorStaffId);
}