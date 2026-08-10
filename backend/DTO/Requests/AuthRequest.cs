using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.DTO.Requests;

public class AuthRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}