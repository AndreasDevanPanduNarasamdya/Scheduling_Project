using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;

    public TicketService(ITicketRepository ticketRepository)
    {
        _ticketRepository = ticketRepository;
    }

    public async Task<Ticket> SubmitTicketAsync(SubmitTicketRequest request, string userId)
    {
        var newTicket = new Ticket
        {
            TicketId = Guid.NewGuid().ToString(),
            StaffId = userId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Type = (TicketType)request.Type,
            Status = (byte)0,
            Title = request.Title,
            Description = request.Description,
            Reason = null,
            // Document = request.Document
        };

        await _ticketRepository.CreateAsync(newTicket);

        return newTicket;
    }
}