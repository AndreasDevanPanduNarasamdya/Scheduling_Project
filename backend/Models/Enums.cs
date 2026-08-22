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

public enum Clearance : byte
{
    Staff,
    Supervisor,
    Admin
}

public enum Action : byte
{
    CreateStaff,
    EditStaff,
    RemoveStaff,
    AccountActivation,
    CreateTicket,
    ApproveTicket,
    DeclineTicket,
    CreateTeam,
    EditTeam,
    RemoveTeam,
    CreatePersonalSchedule,
    EditPersonalSchedule,
    RemovePersonalSchedule,
    CreateTeamSchedule,
    EditTeamSchedule,
    RemoveTeamSchedule,
    SwitchingTeamMembers
}