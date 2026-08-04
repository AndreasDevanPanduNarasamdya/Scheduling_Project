using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;
using SchedulingMeruap.Api.Services;
using SchedulingMeruap.Api.Services.Interfaces;
using SchedulingMeruap.Api.Repositories;
using SchedulingMeruap.Api.Repositories.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IStaffRepository, StaffRepository>();

var app = builder.Build();

app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();