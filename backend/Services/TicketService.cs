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

    // 🔥 1. Fixed constructor to inject all three dependencies properly
    public TicketService(
        ITicketRepository ticketRepository,
        IStaffRepository staffRepository,
        IActivityLogService activityLogService)
    {
        _ticketRepository = ticketRepository;
        _staffRepository = staffRepository;
        _activityLogService = activityLogService;
    }

    // 🔥 2. Added `string? actorStaffId` to the method signature
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

        // 🔥 3. Added back the save call so it actually inserts into your database!
        await _ticketRepository.CreateAsync(newTicket);

        // 🔥 4. Records the action permanently into your history log
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