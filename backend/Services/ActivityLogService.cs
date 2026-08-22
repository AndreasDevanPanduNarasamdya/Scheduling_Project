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

    // 🔥 FIX 1: Look up by UserId (from the JWT Token) OR StaffId
    private async Task<string> GetActorNameAsync(string? actorId)
    {
        if (string.IsNullOrEmpty(actorId)) return "Sistem";

        // Try getting by UserId first (since Controllers pass the Token ID), fallback to StaffId
        var actor = await _staffRepository.GetByUserIdAsync(actorId)
                 ?? await _staffRepository.GetByIdAsync(actorId);

        return actor != null ? $"{actor.FirstName} {actor.LastName}".Trim() : "Sistem";
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
            DateRange = l.DateRange,
            Rotation = l.Rotation,
            Description = l.Description
        }).ToList();
    }

    // ==========================================
    // SCHEDULE LOGS
    // ==========================================

    public async Task LogScheduleCreatedAsync(Timeline timeline, Staff? staff, Team? team, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName ?? "Sistem";
        var actionEnum = staff != null ? Action.CreatePersonalSchedule : Action.CreateTeamSchedule;

        var dateRange = $"{timeline.StartDate:yyyy-MM-dd} - {(timeline.EndDate.HasValue ? timeline.EndDate.Value.ToString("yyyy-MM-dd") : "Seterusnya")}";
        var rotation = $"{timeline.DaysOn} Hari On - {timeline.DaysOff} Hari Off";

        var nowWib = DateTime.UtcNow.AddHours(7); // 🔥 FIX 2: WIB Time

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = actionEnum,
            Target = targetName,
            DateRange = dateRange,
            Rotation = rotation,
            Description = note
        });
    }

    public async Task LogScheduleChangedAsync(Timeline oldTimeline, Timeline newTimeline, Staff? staff, Team? team, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName ?? "Sistem";
        var actionEnum = staff != null ? Action.EditPersonalSchedule : Action.EditTeamSchedule;

        var oldRange = $"{oldTimeline.StartDate:yyyy-MM-dd} - {(oldTimeline.EndDate.HasValue ? oldTimeline.EndDate.Value.ToString("yyyy-MM-dd") : "Seterusnya")}";
        var newRange = $"{newTimeline.StartDate:yyyy-MM-dd} - {(newTimeline.EndDate.HasValue ? newTimeline.EndDate.Value.ToString("yyyy-MM-dd") : "Seterusnya")}";
        var oldRotation = $"{oldTimeline.DaysOn} Hari On - {oldTimeline.DaysOff} Hari Off";
        var newRotation = $"{newTimeline.DaysOn} Hari On - {newTimeline.DaysOff} Hari Off";

        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = actionEnum,
            Target = targetName,
            DateRange = oldRange == newRange ? newRange : $"{oldRange} → {newRange}",
            Rotation = oldRotation == newRotation ? newRotation : $"{oldRotation} → {newRotation}",
            Description = note
        });
    }

    public async Task LogScheduleDeletedAsync(Timeline deleted, Staff? staff, Team? team, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : team?.TeamName ?? "Sistem";
        var actionEnum = staff != null ? Action.RemovePersonalSchedule : Action.RemoveTeamSchedule;

        var dateRange = $"{deleted.StartDate:yyyy-MM-dd} - {(deleted.EndDate.HasValue ? deleted.EndDate.Value.ToString("yyyy-MM-dd") : "Seterusnya")}";
        var rotation = $"{deleted.DaysOn} Hari On - {deleted.DaysOff} Hari Off";

        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = actionEnum,
            Target = targetName,
            DateRange = dateRange,
            Rotation = rotation,
            Description = note
        });
    }

    // ==========================================
    // TICKET LOGS
    // ==========================================

    public async Task LogTicketCreatedAsync(Ticket ticket, Staff staff, string? actorStaffId)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = $"{staff.FirstName} {staff.LastName}".Trim();
        var dateRange = $"{ticket.StartDate:yyyy-MM-dd} - {ticket.EndDate:yyyy-MM-dd}";

        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.CreateTicket,
            Target = targetName,
            Type = ticket.Type,
            DateRange = dateRange,
            Description = ticket.Reason ?? ticket.Title
        });
    }

    public async Task LogTicketApprovedAsync(Ticket ticket, Staff staff, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = $"{staff.FirstName} {staff.LastName}".Trim();
        var dateRange = $"{ticket.StartDate:yyyy-MM-dd} - {ticket.EndDate:yyyy-MM-dd}";

        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.ApproveTicket,
            Target = targetName,
            Type = ticket.Type,
            DateRange = dateRange,
            Description = note
        });
    }

    public async Task LogTicketDeclinedAsync(Ticket ticket, Staff staff, string? actorStaffId, string declineReason)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var targetName = $"{staff.FirstName} {staff.LastName}".Trim();
        var dateRange = $"{ticket.StartDate:yyyy-MM-dd} - {ticket.EndDate:yyyy-MM-dd}";

        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.DeclineTicket,
            Target = targetName,
            Type = ticket.Type,
            DateRange = dateRange,
            Description = declineReason
        });
    }

    // ==========================================
    // STAFF LOGS
    // ==========================================

    public async Task LogStaffCreatedAsync(Staff staff, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.CreateStaff,
            Target = $"{staff.FirstName} {staff.LastName}".Trim(),
            Description = note ?? "Akun baru untuk staff"
        });
    }

    public async Task LogStaffEditedAsync(Staff oldStaff, Staff newStaff, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var diffs = new List<string>();

        if (oldStaff.FirstName != newStaff.FirstName)
            diffs.Add($"First Name: {oldStaff.FirstName} → {newStaff.FirstName}");
        if (oldStaff.LastName != newStaff.LastName)
            diffs.Add($"Last Name: {oldStaff.LastName} → {newStaff.LastName}");
        if (oldStaff.Sex != newStaff.Sex)
            diffs.Add($"Sex: {oldStaff.Sex} → {newStaff.Sex}");
        if (oldStaff.Phone != newStaff.Phone)
            diffs.Add($"Phone: {oldStaff.Phone} → {newStaff.Phone}");
        if (oldStaff.Position != newStaff.Position)
            diffs.Add($"Position: {oldStaff.Position} → {newStaff.Position}");
        if (oldStaff.JoinDate != newStaff.JoinDate)
            diffs.Add($"Tanggal Bergabung: {oldStaff.JoinDate:yyyy-MM-dd} → {newStaff.JoinDate:yyyy-MM-dd}");
        if (oldStaff.Dob != newStaff.Dob)
            diffs.Add($"DOB: {oldStaff.Dob:yyyy-MM-dd} → {newStaff.Dob:yyyy-MM-dd}");

        var editSummary = string.Join("; ", diffs);
        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.EditStaff,
            Target = $"{newStaff.FirstName} {newStaff.LastName}".Trim(),
            Edit = editSummary,
            Description = note
        });
    }

    public async Task LogStaffDeletedAsync(string staffName, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.RemoveStaff,
            Target = staffName,
            Description = note ?? "Dipecat"
        });
    }

    public async Task LogAccountActivatedAsync(Staff staff)
    {
        var staffName = $"{staff.FirstName} {staff.LastName}".Trim();
        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = staffName,
            Action = Action.AccountActivation,
            Target = staffName,
            Description = "Berhasil mengaktivasi akun dan membuat password"
        });
    }

    // ==========================================
    // TEAM LOGS
    // ==========================================

    public async Task LogTeamCreatedAsync(Team team, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.CreateTeam,
            Target = team.TeamName,
            Description = note ?? "Membuat tim lapangan baru"
        });
    }

    public async Task LogTeamEditedAsync(string oldTeamName, Team newTeam, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.EditTeam,
            Target = newTeam.TeamName,
            Edit = oldTeamName == newTeam.TeamName ? null : $"{oldTeamName} → {newTeam.TeamName}",
            Description = note
        });
    }

    public async Task LogTeamDeletedAsync(string teamName, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.RemoveTeam,
            Target = teamName,
            Description = note ?? "Menghapus tim beserta strukturnya dari sistem"
        });
    }

    public async Task LogTeamMemberSwitchedAsync(Staff staff, Team? oldTeam, Team newTeam, string? actorStaffId, string? note = null)
    {
        var actorName = await GetActorNameAsync(actorStaffId);
        var staffName = $"{staff.FirstName} {staff.LastName}".Trim();
        var teamInfo = oldTeam == null ? newTeam.TeamName : $"{oldTeam.TeamName} → {newTeam.TeamName}";

        var nowWib = DateTime.UtcNow.AddHours(7);

        await _activityLogRepository.AddAsync(new ActivityLog
        {
            LogId = Guid.NewGuid().ToString(),
            Date = nowWib.Date,
            Time = nowWib.TimeOfDay,
            Actor = actorName,
            Action = Action.SwitchingTeamMembers,
            Target = staffName,
            Rotation = teamInfo,
            Description = note
        });
    }
}