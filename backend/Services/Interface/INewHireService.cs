using System.Threading.Tasks;
using SchedulingMeruap.Api.DTO.Responses;

namespace SchedulingMeruap.Api.Services.Interfaces;

public interface INewHireService
{
    Task<bool> ActivateAccountAsync(string token, string password);
    Task<NewHireResponse> ValidateTokenAsync(string token);
}