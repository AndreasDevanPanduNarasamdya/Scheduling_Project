namespace Program_Scheduling_Meruap.Models.User;

public class User
{
    public required string User_ID { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public DateOnly Created { get; set; }
    public required bool Locked { get; set; }
}