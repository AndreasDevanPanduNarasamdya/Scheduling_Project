using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;

namespace SchedulingMeruap.Api.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IAuthRepository authRepository, IConfiguration configuration)
    {
        _authRepository = authRepository;
        _configuration = configuration;
    }

    public async Task<(User User, string Token)?> LoginAsync(AuthRequest request)
    {
        var email = request.Email.Trim();

        var user = await _authRepository.GetByEmailAsync(email);
        if (user == null) return null;

        if (user.Locked) return null;

        if (user.Password != request.Password) return null;

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Clearance.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddSeconds(15),
            signingCredentials: credentials);

        var generatedToken = new JwtSecurityTokenHandler().WriteToken(token);

        return (user, generatedToken);
    }
}