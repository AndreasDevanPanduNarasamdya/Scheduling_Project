using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Repositories.Interfaces;

namespace SchedulingMeruap.Api.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly ApplicationDbContext _dbContext;

    public TicketRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task CreateAsync(Ticket ticket)
    {
        await _dbContext.Tickets.AddAsync(ticket);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<IEnumerable<Ticket>> GetAllTicketsAsync()
    {
        return await _dbContext.Tickets
            .Include(t => t.Staff)
            .OrderByDescending(t => t.TicketId)
            .ToListAsync();
    }
    public async Task<Ticket> GetByIdAsync(string id)
    {
        return await _dbContext.Tickets.FindAsync(id);
    }

    public async Task UpdateAsync(Ticket ticket)
    {
        _dbContext.Tickets.Update(ticket);
        await _dbContext.SaveChangesAsync();
    }
}
