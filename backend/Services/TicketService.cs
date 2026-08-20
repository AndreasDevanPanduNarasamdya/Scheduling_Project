using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.DTO.Requests;

namespace SchedulingMeruap.Api.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IStaffRepository _staffRepository;
    private readonly IActivityLogService _activityLogService;

    public TicketService(
        ITicketRepository ticketRepository,
        IStaffRepository staffRepository,
        IActivityLogService activityLogService)
    {
        _ticketRepository = ticketRepository;
        _staffRepository = staffRepository;
        _activityLogService = activityLogService;
    }

    public async Task<Ticket> SubmitTicketAsync(SubmitTicketRequest request, string userId, string? actorStaffId)
    {
        var newTicket = new Ticket
        {
            TicketId = Guid.NewGuid().ToString(),
            StaffId = userId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Type = request.Type,
            Status = TicketStatus.Pending,
            Title = request.Title,
            Description = request.Description,
            Reason = null,
        };

        await _ticketRepository.CreateAsync(newTicket);

        // 🔥 Logs the ticket creation
        var staff = await _staffRepository.GetByIdAsync(userId);
        if (staff != null)
        {
            await _activityLogService.LogTicketCreatedAsync(newTicket, staff, actorStaffId);
        }

        return newTicket;
    }

    public async Task<IEnumerable<Ticket>> GetAllTicketsAsync()
    {
        return await _ticketRepository.GetAllTicketsAsync();
    }

    public async Task ApproveTicketAsync(string id, string reason, string? actorStaffId)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id);
        if (ticket == null) throw new KeyNotFoundException("Ticket not found");

        ticket.Status = TicketStatus.Approved;
        ticket.Reason = reason;

        await _ticketRepository.UpdateAsync(ticket);

        // 🔥 Fetch the staff member who owns the ticket, then log the approval!
        var staff = await _staffRepository.GetByIdAsync(ticket.StaffId);
        if (staff != null)
        {
            await _activityLogService.LogTicketApprovedAsync(ticket, staff, actorStaffId);
        }
    }

    public async Task RejectTicketAsync(string id, string reason, string? actorStaffId)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id);
        if (ticket == null) throw new KeyNotFoundException("Ticket not found");

        ticket.Status = TicketStatus.Declined;
        ticket.Reason = reason;

        await _ticketRepository.UpdateAsync(ticket);

        // 🔥 Fetch the staff member who owns the ticket, then log the rejection!
        var staff = await _staffRepository.GetByIdAsync(ticket.StaffId);
        if (staff != null)
        {
            await _activityLogService.LogTicketDeclinedAsync(ticket, staff, actorStaffId, reason);
        }
    }
}