using System.Threading.Tasks;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface INewHireService
{
    Task<bool> ActivateAccountAsync(string token, string password);
    Task<string> ValidateTokenAsync(string token);
}