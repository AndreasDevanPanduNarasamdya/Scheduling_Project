using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.DTO.Requests;

public class StaffRequest
{
    public string StaffId { get; set; } = null!;
    public string TeamId { get; set; } = null!;
}

public class UpdateStaffRequest
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public Sex Sex { get; set; }
    public string Position { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public DateTime Dob { get; set; }
    public DateTime JoinDate { get; set; }
    public Clearance Clearance { get; set; }
}
