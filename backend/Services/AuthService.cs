using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;

namespace SchedulingMeruap.Api.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;

    public AuthService(IAuthRepository authRepository)
    {
        _authRepository = authRepository;
    }

    public async Task<User?> LoginAsync(AuthRequest request)
    {
        var email = request.Email.Trim();

        var user = await _authRepository.GetByEmailAsync(email);
        if (user == null) return null;

        if (user.Locked) return null;

        if (user.Password != request.Password) return null;

        return user;
    }
}