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
    private readonly SigningCredentials _credentials;
    private readonly string _issuer;
    private readonly string _audience;
    private static readonly JwtSecurityTokenHandler _tokenHandler = new JwtSecurityTokenHandler();

    public AuthService(IAuthRepository authRepository, IConfiguration configuration)
    {
        _authRepository = authRepository;

        _issuer = configuration["Jwt:Issuer"];
        _audience = configuration["Jwt:Audience"];

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]));
        _credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
    }

    public async Task<(User User, string Token)?> LoginAsync(AuthRequest request)
    {
        var user = await _authRepository.GetByEmailAsync(request.Email.Trim());

        if (user == null || user.Locked)
            return null;

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);

        if (!isPasswordValid)
            return null;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, ((int)user.Clearance).ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: _credentials);

        return (user, _tokenHandler.WriteToken(token));
    }
}