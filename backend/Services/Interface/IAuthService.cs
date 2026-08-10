using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface IAuthService
{
    Task<(User User, string Token)?> LoginAsync(AuthRequest request);
}