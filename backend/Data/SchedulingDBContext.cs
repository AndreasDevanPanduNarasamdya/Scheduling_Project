using Microsoft.EntityFrameworkCore;
using Program_Scheduling_Meruap.Models; // Replace with your actual namespace

namespace Program_Scheduling_Meruap.Data
{
    public class SchedulingDBContext : DbContext
    {
        public SchedulingDBContext(DbContextOptions<SchedulingDBContext> options)
            : base(options)
        {
        }
    }
}