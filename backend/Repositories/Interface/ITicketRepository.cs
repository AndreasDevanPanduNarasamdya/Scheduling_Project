using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface ITicketRepository
{
    Task CreateAsync(Ticket ticket);
    // You can add GetByIdAsync, GetAllAsync later if you build a dashboard for managers
}
