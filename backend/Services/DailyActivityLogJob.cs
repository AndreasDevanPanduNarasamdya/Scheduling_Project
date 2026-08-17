namespace SchedulingMeruap.Api.Services;

public class DailyActivityLogJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public DailyActivityLogJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var nextRun = now.Date.AddDays(1); // next midnight UTC
            var delay = nextRun - now;

            await Task.Delay(delay, stoppingToken);

            using var scope = _scopeFactory.CreateScope();
            var activityLogService = scope.ServiceProvider.GetRequiredService<Services.Interfaces.IActivityLogService>();
            await activityLogService.GenerateDailyLogsAsync(DateTime.UtcNow.Date.AddDays(-1));
        }
    }
}