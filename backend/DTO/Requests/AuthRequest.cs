namespace Program_Scheduling_Meruap.DTO.Requests.AuthRequest;

using Program_Scheduling_Meruap.Models.Enums;
public class AuthRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}