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

    public NewHireService(INewHireRepository newHireRepository, ApplicationDbContext context)
    {
        _newHireRepository = newHireRepository;
        _context = context;
    }

    public async Task<bool> ActivateAccountAsync(string token, string password)
    {
        // 1. Find the staging record by token and verify expiration
        var newHire = await _newHireRepository.GetByTokenAsync(token);
        if (newHire == null || newHire.TokenExpiry < DateTime.Now)
        {
            return false;
        }

        // 2. Open a transaction to ensure atomic execution (all or nothing)
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string userId = Guid.NewGuid().ToString();

            // 3. Create the permanent User record
            var user = new User
            {
                UserId = userId,
                Email = newHire.Email,
                Password = password,
                Created = DateTime.Now,
                Locked = false
            };
            _context.Users.Add(user);

            // 4. Create the permanent Staff record linked to the User
            var staff = new Staff
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

            // 5. Remove the temporary record from the staging table
            _context.NewHires.Remove(newHire);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
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

        if (newHire == null)
        {
            return new NewHireResponse { Status = "invalid" };
        }

        if (newHire.TokenExpiry < DateTime.Now)
        {
            return new NewHireResponse { Status = "expired" };
        }

        // Token is valid! Grab the name and send it back.
        return new NewHireResponse
        {
            Status = "valid",
            Name = $"{newHire.FirstName} {newHire.LastName}".Trim()
        };
    }
}