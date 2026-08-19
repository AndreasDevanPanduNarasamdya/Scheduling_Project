namespace SchedulingMeruap.Api.Models;

public enum TicketStatus : byte
{
    Pending,
    Approved,
    Declined
}

public enum TicketType : byte
{
    On,
    Off
}

public enum Sex : byte
{
    Male,
    Female
}

public enum Action : byte
{
    CreateStaff = 1,
    EditStaff = 2,
    RemoveStaff = 3,
    AccountActivation = 4,
    CreateTicket = 5,
    ApproveTicket = 6,
    DeclineTicket = 7,
    CreateTeam = 8,
    EditTeam = 9,
    RemoveTeam = 10,
    CreatePersonalSchedule = 11,
    EditPersonalSchedule = 12,
    RemovePersonalSchedule = 13,
    CreateTeamSchedule = 14,
    EditTeamSchedule = 15,
    RemoveTeamSchedule = 16
}