using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.DTO.Responses;

public class StaffResponse
{
    public string StaffId { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public int Sex { get; set; }
    public string Position { get; set; } = null!;
    public string? Email { get; set; }
    public string Phone { get; set; } = null!;
    public DateTime Dob { get; set; }
    public DateTime JoinDate { get; set; }
    public int Clearance { get; set; }
}