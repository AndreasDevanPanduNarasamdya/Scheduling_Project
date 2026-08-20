namespace SchedulingMeruap.Api.DTO.Responses;

public class StaffResponse
{
    public string StaffId { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public byte Sex { get; set; }
    public string Position { get; set; } = null!;
    public string? Email { get; set; }
    public string Phone { get; set; } = null!;
    public DateTime Dob { get; set; }
    public DateTime JoinDate { get; set; }
}