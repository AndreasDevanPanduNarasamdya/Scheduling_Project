// using Microsoft.EntityFrameworkCore;
// using Program_Scheduling_Meruap.Data;
// using Program_Scheduling_Meruap.Models;
// using HRScheduling.Api.Repositories.Interfaces;

// namespace HRScheduling.Api.Repositories;

// public class AuthRepository : IAuthRepository
// {
//     private readonly AppDbContext _dbContext;

//     public AuthRepository(AppDbContext dbContext)
//     {
//         _dbContext = dbContext;
//     }

//     public async Task<User?> GetByUsernameOrEmailAsync(string input)
//     {
//         return await _dbContext.UserAccounts
//             .FirstOrDefaultAsync(u => u.Username == input || u.Email == input);
//     }

//     public async Task UpdateAsync(UserAccount userAccount)
//     {
//         _dbContext.UserAccounts.Update(userAccount);
//         await _dbContext.SaveChangesAsync();
//     }
// }