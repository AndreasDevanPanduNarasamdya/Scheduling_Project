using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Repositories.Interfaces;

public interface IAuthRepository
{
    Task<User?> GetByEmailAsync(string email);
}