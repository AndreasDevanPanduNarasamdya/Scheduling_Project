using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.DTO.Requests;

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
    public async Task<IEnumerable<Ticket>> GetAllTicketsAsync()
    {
        return await _ticketRepository.GetAllTicketsAsync();
    }
    public async Task ApproveTicketAsync(string id, string reason)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id);
        if (ticket == null) throw new KeyNotFoundException("Ticket not found");

        ticket.Status = (TicketStatus)1;
        ticket.Reason = reason;

        await _ticketRepository.UpdateAsync(ticket);
    }

    public async Task RejectTicketAsync(string id, string reason)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id);
        if (ticket == null) throw new KeyNotFoundException("Ticket not found");

        ticket.Status = (TicketStatus)2;
        ticket.Reason = reason;

        await _ticketRepository.UpdateAsync(ticket);
    }
}