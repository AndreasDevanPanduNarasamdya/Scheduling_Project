using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Data;
using System.Threading.Tasks;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public class NewHireRepository : INewHireRepository
{
    private readonly ApplicationDbContext _context;

    public NewHireRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(NewHire newHire)
    {
        await _context.NewHires.AddAsync(newHire);
        await _context.SaveChangesAsync();
    }

    public async Task<NewHire?> GetByTokenAsync(string token)
    {
        return await _context.NewHires
            .FirstOrDefaultAsync(n => n.ActivationToken == token);
    }

    public async Task DeleteAsync(NewHire newHire)
    {
        _context.NewHires.Remove(newHire);
        await _context.SaveChangesAsync();
    }
}