using SchedulingMeruap.Api.Models;
using System.Threading.Tasks;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface INewHireRepository
{
    Task AddAsync(NewHire newHire);
    Task<NewHire?> GetByTokenAsync(string token);
    Task DeleteAsync(NewHire newHire);
}