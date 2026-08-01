using Microsoft.EntityFrameworkCore;
using Program_Scheduling_Meruap.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// 1. Add Controllers support (essential for standard REST API endpoints like /api/auth/login)
builder.Services.AddControllers();

// 2. Register ApplicationDbContext with SQL Server
builder.Services.AddDbContext<SchedulingDBContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Configure CORS for your React frontend (Vite defaults to 5173)
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

// 4. Enable Controller route mapping (so requests to /api/auth/login find your controllers)
app.MapControllers();
