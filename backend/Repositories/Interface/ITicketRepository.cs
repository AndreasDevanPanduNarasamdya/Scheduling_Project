using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface ITicketRepository
{
    Task CreateAsync(Ticket ticket);
    Task<IEnumerable<Ticket>> GetAllTicketsAsync();
    Task<Ticket> GetByIdAsync(string id);
    Task UpdateAsync(Ticket ticket);
}
