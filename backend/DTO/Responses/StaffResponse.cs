namespace SchedulingMeruap.Api.DTO.Responses;

public class StaffResponse
{
    public string StaffId { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Position { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public DateTime JoinDate { get; set; }
}