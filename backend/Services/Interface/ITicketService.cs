using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface ITicketService
{
    Task<Ticket> SubmitTicketAsync(SubmitTicketRequest request, string userId);
}