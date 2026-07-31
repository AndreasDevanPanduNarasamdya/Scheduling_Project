namespace Program_Scheduling_Meruap.Models.Staff;

using Program_Scheduling_Meruap.Models.Enums;

public class Staff
{
    public required string Staff_ID { get; set; }
    public required string User_ID { get; set; }
    public required string First_Name { get; set; }
    public required string Last_Name { get; set; }
    public required Sex Sex { get; set; }
    public required string Position { get; set; }
    public required string Phone { get; set; }
    public required DateOnly Join_Date { get; set; }
    public required DateOnly DOB { get; set; }
}