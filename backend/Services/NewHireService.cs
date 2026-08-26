using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Models;
using SchedulingMeruap.Api.DTO.Responses;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace SchedulingMeruap.Api.Services;

public class NewHireService : INewHireService
{
    private readonly INewHireRepository _newHireRepository;
    private readonly ApplicationDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public NewHireService(
        INewHireRepository newHireRepository,
        ApplicationDbContext context,
        IActivityLogService activityLogService)
    {
        _newHireRepository = newHireRepository;
        _context = context;
        _activityLogService = activityLogService;
    }

    public async Task<bool> ActivateAccountAsync(string token, string password)
    {
        var newHire = await _newHireRepository.GetByTokenAsync(token);

        if (newHire is null || newHire.TokenExpiry < DateTime.UtcNow)
            return false;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string userId = Guid.NewGuid().ToString();

            // Target-typed object initialization
            User user = new()
            {
                UserId = userId,
                Email = newHire.Email,
                Password = password,
                Created = DateTime.UtcNow,
                Locked = false,
            };
            _context.Users.Add(user);

            Staff staff = new()
            {
                StaffId = Guid.NewGuid().ToString(),
                UserId = userId,
                FirstName = newHire.FirstName,
                LastName = newHire.LastName,
                Sex = newHire.Sex,
                Position = newHire.Position,
                Phone = newHire.Phone,
                Dob = newHire.Dob,
                JoinDate = newHire.JoinDate
            };
            _context.Staff.Add(staff);
            _context.NewHires.Remove(newHire);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // 🔥 OPTIMIZATION: Log AFTER commit to avoid holding database locks longer than necessary
            await _activityLogService.LogAccountActivatedAsync(staff);

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<NewHireResponse> ValidateTokenAsync(string token)
    {
        var newHire = await _newHireRepository.GetByTokenAsync(token);

        if (newHire is null)
            return new NewHireResponse { Status = "invalid" };

        // 🔥 FIX: UtcNow matching
        if (newHire.TokenExpiry < DateTime.UtcNow)
            return new NewHireResponse { Status = "expired" };

        return new NewHireResponse
        {
            Status = "valid",
            Name = $"{newHire.FirstName} {newHire.LastName}".Trim()
        };
    }
}