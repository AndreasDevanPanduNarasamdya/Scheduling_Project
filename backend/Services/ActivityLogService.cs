using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.DTO;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.DTO.Requests;
using SchedulingMeruap.Api.Models;
using Action = SchedulingMeruap.Api.Models.Action;

namespace SchedulingMeruap.Api.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IActivityLogRepository _activityLogRepository;
    private readonly IStaffRepository _staffRepository;

    public ActivityLogService(
        IActivityLogRepository activityLogRepository,
        IStaffRepository staffRepository)
    {
        _activityLogRepository = activityLogRepository;
        _staffRepository = staffRepository;
    }

    // OPTIMIZATION 1: Centralized Name Formatter but this isn't for the remaining of the time optimization is just a unique word for what is it
    private static string GetFullName(Staff staff) => $"{staff.FirstName} {staff.LastName}".Trim();
    // private static string GetEndDate(DateTime endDate) => endDate.ToString("yyyy-MM-dd");

    private async Task<string> GetActorNameAsync(string? actorId)
    {
        if (string.IsNullOrEmpty(actorId)) return "Sistem";

        var actor = await _staffRepository.GetByUserIdAsync(actorId)
                 ?? await _staffRepository.GetByIdAsync(actorId);

        return actor != null ? GetFullName(actor) : "Sistem";
    }

    private async Task WriteLogAsync(ActivityLog log)
    {
        var nowWib = DateTime.UtcNow.AddHours(7);
        log.LogId = Guid.NewGuid().ToString();
        log.Date = DateOnly.FromDateTime(nowWib);
        log.Time = nowWib.TimeOfDay;

        await _activityLogRepository.AddAsync(log);
    }

    public async Task<List<ActivityLogResponse>> GetLogsAsync(DateTime? startDate, DateTime? endDate, string? staffId, string? teamId)
    {
        var logs = await _activityLogRepository.GetLogsAsync(startDate, endDate, staffId, teamId);

        return logs.Select(l => new ActivityLogResponse
        {
            LogId = l.LogId,
            Date = l.Date,
            Time = l.Time,
            Actor = l.Actor,
            Action = l.Action,
            Target = l.Target,
            Type = l.Type,
            Edit = l.Edit,
            RangeStart = l.RangeStart,
            RangeEnd = l.RangeEnd,
            Rotation = l.Rotation,
            Description = l.Description
        }).ToList();
    }

    public async Task LogScheduleCreatedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId, string? note = null)
    {
        var idCulture = new System.Globalization.CultureInfo("id-ID");
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = staff != null ? Action.CreatePersonalSchedule : Action.CreateTeamSchedule,
            Target = staff != null ? GetFullName(staff) : team?.TeamName ?? "Sistem",
            RangeStart = DateOnly.FromDateTime(timeline.StartDate),
            RangeEnd = DateOnly.FromDateTime(timeline.EndDate),
            Rotation = $"{timeline.DaysOn} Hari On - {timeline.DaysOff} Hari Off",
            Description = note
        });
    }

    public async Task LogScheduleChangedAsync(Timeline oldTimeline, Timeline newTimeline, Staff? staff, Team? team, string? actorStaffId, string? note = null)
    {
        var oldRotation = $"{oldTimeline.DaysOn} Hari On - {oldTimeline.DaysOff} Hari Off";
        var newRotation = $"{newTimeline.DaysOn} Hari On - {newTimeline.DaysOff} Hari Off";
        var oldRangeText = $"{oldTimeline.StartDate:yyyy-MM-dd} - {oldTimeline.EndDate:yyyy-MM-dd}";
        var newRangeText = $"{newTimeline.StartDate:yyyy-MM-dd} - {newTimeline.EndDate:yyyy-MM-dd}";

        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = staff != null ? Action.EditPersonalSchedule : Action.EditTeamSchedule,
            Target = staff != null ? GetFullName(staff) : team?.TeamName ?? "Sistem",
            RangeStart = DateOnly.FromDateTime(newTimeline.StartDate),
            RangeEnd = DateOnly.FromDateTime(newTimeline.EndDate),
            Edit = oldRangeText == newRangeText ? null : $"Tanggal: {oldRangeText} → {newRangeText}",
            Rotation = oldRotation == newRotation ? newRotation : $"{oldRotation} → {newRotation}",
            Description = note
        });
    }

    public async Task LogScheduleDeletedAsync(Timeline deleted, Staff? staff, Team? team, string? actorStaffId, string? note = null)
    {
        var idCulture = new System.Globalization.CultureInfo("id-ID");
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = staff != null ? Action.RemovePersonalSchedule : Action.RemoveTeamSchedule,
            Target = staff != null ? GetFullName(staff) : team?.TeamName ?? "Sistem",
            RangeStart = DateOnly.FromDateTime(deleted.StartDate),
            RangeEnd = DateOnly.FromDateTime(deleted.EndDate),
            Rotation = $"{deleted.DaysOn} Hari On - {deleted.DaysOff} Hari Off",
            Description = note
        });
    }

    public async Task LogTicketCreatedAsync(Ticket ticket, Staff staff, string? actorStaffId)
    {
        var idCulture = new System.Globalization.CultureInfo("id-ID");
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.CreateTicket,
            Target = GetFullName(staff),
            Type = ticket.Type,
            RangeStart = DateOnly.FromDateTime(ticket.StartDate),
            RangeEnd = DateOnly.FromDateTime(ticket.EndDate),
            Description = ticket.Description
        });
    }

    public async Task LogTicketApprovedAsync(Ticket ticket, Staff staff, string? actorStaffId, string? note = null)
    {
        var idCulture = new System.Globalization.CultureInfo("id-ID");
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.ApproveTicket,
            Target = GetFullName(staff),
            Type = ticket.Type,
            RangeStart = DateOnly.FromDateTime(ticket.StartDate),
            RangeEnd = DateOnly.FromDateTime(ticket.EndDate),
            Description = note
        });
    }

    public async Task LogTicketDeclinedAsync(Ticket ticket, Staff staff, string? actorStaffId, string declineReason)
    {
        var idCulture = new System.Globalization.CultureInfo("id-ID");
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.DeclineTicket,
            Target = GetFullName(staff),
            Type = ticket.Type,
            RangeStart = DateOnly.FromDateTime(ticket.StartDate),
            RangeEnd = DateOnly.FromDateTime(ticket.EndDate),
            Description = declineReason
        });
    }
    public async Task LogStaffCreatedAsync(Staff staff, string? actorStaffId, string? note = null)
    {
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.CreateStaff,
            Target = GetFullName(staff),
            Description = note ?? "Akun baru untuk staff"
        });
    }
    public async Task LogStaffEditedAsync(
        Staff oldStaff, Staff newStaff,
        string? oldEmail, string? newEmail,
        Models.Clearance oldClearance, Models.Clearance newClearance,
        string? actorStaffId, string? note = null)
    {
        var diffs = new List<string>();

        if (oldStaff.FirstName != newStaff.FirstName) diffs.Add($"First Name: {oldStaff.FirstName} → {newStaff.FirstName}");
        if (oldStaff.LastName != newStaff.LastName) diffs.Add($"Last Name: {oldStaff.LastName} → {newStaff.LastName}");
        if (oldStaff.Sex != newStaff.Sex) diffs.Add($"Sex: {oldStaff.Sex} → {newStaff.Sex}");
        if (oldStaff.Phone != newStaff.Phone) diffs.Add($"Phone: {oldStaff.Phone} → {newStaff.Phone}");
        if (oldStaff.Position != newStaff.Position) diffs.Add($"Position: {oldStaff.Position} → {newStaff.Position}");
        if (oldStaff.JoinDate != newStaff.JoinDate) diffs.Add($"Tanggal Bergabung: {oldStaff.JoinDate:yyyy-MM-dd} → {newStaff.JoinDate:yyyy-MM-dd}");
        if (oldStaff.Dob != newStaff.Dob) diffs.Add($"DOB: {oldStaff.Dob:yyyy-MM-dd} → {newStaff.Dob:yyyy-MM-dd}");
        if (oldEmail != newEmail) diffs.Add($"Email: {oldEmail} → {newEmail}");
        if (oldClearance != newClearance) diffs.Add($"Tingkat Akses: {oldClearance} → {newClearance}");

        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.EditStaff,
            Target = GetFullName(newStaff),
            Edit = string.Join("; ", diffs),
            Description = note
        });
    }

    public async Task LogStaffDeletedAsync(string staffName, string? actorStaffId, string? note = null)
    {
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.RemoveStaff,
            Target = staffName,
            Description = note ?? "Dipecat"
        });
    }

    public async Task LogAccountActivatedAsync(Staff staff)
    {
        var staffName = GetFullName(staff);

        await WriteLogAsync(new ActivityLog
        {
            Actor = staffName,
            Action = Action.AccountActivation,
            Target = staffName,
            Description = "Berhasil mengaktivasi akun dan membuat password"
        });
    }

    public async Task LogTeamCreatedAsync(Team team, string? actorStaffId, string? note = null)
    {
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.CreateTeam,
            Target = team.TeamName,
            Description = note ?? "Membuat tim lapangan baru"
        });
    }

    public async Task LogTeamEditedAsync(string oldTeamName, Team newTeam, string? actorStaffId, string? note = null)
    {
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.EditTeam,
            Target = newTeam.TeamName,
            Edit = oldTeamName == newTeam.TeamName ? null : $"{oldTeamName} → {newTeam.TeamName}",
            Description = note
        });
    }

    public async Task LogTeamDeletedAsync(string teamName, string? actorStaffId, string? note = null)
    {
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.RemoveTeam,
            Target = teamName,
            Description = note ?? "Menghapus tim beserta strukturnya dari sistem"
        });
    }

    public async Task LogTeamMemberSwitchedAsync(Staff staff, Team? oldTeam, Team newTeam, string? actorStaffId, string? note = null)
    {
        await WriteLogAsync(new ActivityLog
        {
            Actor = await GetActorNameAsync(actorStaffId),
            Action = Action.SwitchingTeamMembers,
            Target = GetFullName(staff),
            Rotation = oldTeam == null ? newTeam.TeamName : $"{oldTeam.TeamName} → {newTeam.TeamName}",
            Description = note
        });
    }
}