namespace Program_Scheduling_Meruap.Models.Team;

public class Team
{
    public required string Team_ID { get; set; }
    public required string Team_Name { get; set; }
    public required DateOnly Created { get; set; }
}