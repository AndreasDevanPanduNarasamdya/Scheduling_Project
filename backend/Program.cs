using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Data;

using SchedulingMeruap.Api.Repositories;
using SchedulingMeruap.Api.Repositories.Interfaces;
using SchedulingMeruap.Api.Services;
using SchedulingMeruap.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// 1. Add Controllers support (essential for standard REST API endpoints like /api/auth/login)
builder.Services.AddControllers();

// 2. Register ApplicationDbContext with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Register your repositories and services so dependency injection can supply them
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStaffRepository, StaffRepository>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<ITicketService, TicketService>();

// 4. Configure CORS for your React frontend (Vite defaults to 5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowReactApp");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// 5. Enable Controller route mapping (so requests to /api/auth/login find your controllers)
app.MapControllers();

app.Run();