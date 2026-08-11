using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using SchedulingMeruap.Api.Models;

namespace SchedulingMeruap.Api.Data;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Timeline> Timelines { get; set; }
    public virtual DbSet<ActivityLog> ActivityLogs { get; set; }

    // public virtual DbSet<Schedule> Schedules { get; set; }

    // public virtual DbSet<Shift> Shifts { get; set; }

    public virtual DbSet<Staff> Staff { get; set; }

    public virtual DbSet<StaffTeam> StaffTeams { get; set; }

    public virtual DbSet<Team> Teams { get; set; }

    public virtual DbSet<Ticket> Tickets { get; set; }

    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<NewHire> NewHires { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Timeline>(entity =>
        {
            entity.ToTable("TIMELINE");

            entity.HasIndex(e => e.TeamId, "TEAM_INDX");
            entity.HasIndex(e => e.StaffId, "STAFF_INDX");

            entity.Property(e => e.TimelineId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("TIMELINE_ID");
            entity.Property(e => e.TeamId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("TEAM_ID");
            entity.Property(e => e.StaffId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("STAFF_ID");
            entity.Property(e => e.StartDate)
                .HasColumnType("datetime")
                .HasColumnName("START_DATE");
            entity.Property(e => e.DaysOn)
                .HasColumnName("DAYS_ON");
            entity.Property(e => e.DaysOff)
                .HasColumnName("DAYS_OFF");
            entity.Property(e => e.EndDate)
                .HasColumnType("datetime")
                .HasColumnName("END_DATE");

            entity.HasOne(d => d.Team)
                .WithMany()
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_ROTATION_REFERENCE_TEAM");

            entity.HasOne(d => d.Staff)
                .WithMany()
                .HasForeignKey(d => d.StaffId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_ROTATION_REFERENCE_STAFF");
        });
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.LogId);

            entity.ToTable("ACTIVITY_LOG");

            // entity.HasIndex(e => e.ScheduleId, "SCHEDULE_INDX");

            entity.Property(e => e.LogId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("LOG_ID");
            entity.Property(e => e.Description)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("DESCRIPTION");
            entity.Property(e => e.Document)
                .HasMaxLength(70)
                .IsUnicode(false)
                .HasColumnName("DOCUMENT");
            entity.Property(e => e.FirstName)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("FIRST_NAME");
            entity.Property(e => e.LastName)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("LAST_NAME");
            entity.Property(e => e.Position)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("POSITION");
            // entity.Property(e => e.ScheduleId)
            //     .HasMaxLength(36)
            //     .IsUnicode(false)
            //     .HasColumnName("SCHEDULE_ID");
            entity.Property(e => e.Team)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("TEAM");
            entity.Property(e => e.Type)
                .HasMaxLength(1)
                .IsUnicode(false)
                .HasColumnName("TYPE");

            // entity.HasOne(d => d.Schedule).WithMany(p => p.ActivityLogs)
            //     .HasForeignKey(d => d.ScheduleId)
            //     .OnDelete(DeleteBehavior.ClientSetNull)
            //     .HasConstraintName("FK_ACTIVITY_REFERENCE_SCHEDULE");
        });

        // modelBuilder.Entity<Schedule>(entity =>
        // {
        //     entity.ToTable("SCHEDULE");

        //     entity.HasIndex(e => e.Date, "DATE_INDX");

        //     entity.Property(e => e.ScheduleId)
        //         .HasMaxLength(36)
        //         .IsUnicode(false)
        //         .HasColumnName("SCHEDULE_ID");
        //     entity.Property(e => e.Date)
        //         .HasColumnType("datetime")
        //         .HasColumnName("DATE");
        // });

        // modelBuilder.Entity<Shift>(entity =>
        // {
        //     entity.ToTable("SHIFT");

        //     entity.HasIndex(e => e.ScheduleId, "SCHEDULE_INDX");

        //     entity.HasIndex(e => e.TeamId, "TEAM_INDX");

        //     entity.Property(e => e.ShiftId)
        //         .HasMaxLength(36)
        //         .IsUnicode(false)
        //         .HasColumnName("SHIFT_ID");
        //     entity.Property(e => e.ScheduleId)
        //         .HasMaxLength(36)
        //         .IsUnicode(false)
        //         .HasColumnName("SCHEDULE_ID");
        //     entity.Property(e => e.TeamId)
        //         .HasMaxLength(36)
        //         .IsUnicode(false)
        //         .HasColumnName("TEAM_ID");

        //     entity.HasOne(d => d.Schedule).WithMany(p => p.Shifts)
        //         .HasForeignKey(d => d.ScheduleId)
        //         .HasConstraintName("FK_SHIFT_REFERENCE_SCHEDULE");

        //     entity.HasOne(d => d.Team).WithMany(p => p.Shifts)
        //         .HasForeignKey(d => d.TeamId)
        //         .HasConstraintName("FK_SHIFT_REFERENCE_TEAM");
        // });

        modelBuilder.Entity<Staff>(entity =>
        {
            entity.ToTable("STAFF");

            entity.HasIndex(e => e.FirstName, "FIRST_NAME_INDX");

            entity.HasIndex(e => e.LastName, "LAST_NAME_INDX");

            entity.HasIndex(e => e.Position, "POSITON_INDX");

            entity.HasIndex(e => e.UserId, "USER_INDX");

            entity.Property(e => e.StaffId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("STAFF_ID");
            entity.Property(e => e.Dob)
                .HasColumnType("datetime")
                .HasColumnName("DOB");
            entity.Property(e => e.FirstName)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("FIRST_NAME");
            entity.Property(e => e.JoinDate)
                .HasColumnType("datetime")
                .HasColumnName("JOIN_DATE");
            entity.Property(e => e.LastName)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("LAST_NAME");
            entity.Property(e => e.Phone)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("PHONE");
            entity.Property(e => e.Position)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("POSITION");
            entity.Property(e => e.Sex)
                .HasColumnType("tinyint")
                .HasColumnName("SEX");
            entity.Property(e => e.UserId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("USER_ID");

            entity.HasOne(d => d.User).WithMany(p => p.Staff)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_STAFF_REFERENCE_USER");
        });

        modelBuilder.Entity<NewHire>(entity =>
        {
            entity.ToTable("NEW_HIRE");

            entity.HasIndex(e => e.ActivationToken, "ACTIVATION_TOKEN_INDX").IsUnique();
            entity.HasIndex(e => e.FirstName, "FIRST_NAME_INDX");
            entity.HasIndex(e => e.LastName, "LAST_NAME_INDX");
            entity.HasIndex(e => e.Position, "POSITON_INDX");

            entity.Property(e => e.NewHireId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("NEW_HIRE_ID");

            entity.Property(e => e.ActivationToken)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("ACTIVATION_TOKEN");
            entity.Property(e => e.TokenExpiry)
                .HasColumnType("datetime")
                .HasColumnName("TOKEN_EXPIRY");

            entity.Property(e => e.Email)
                .HasMaxLength(70)
                .IsUnicode(false)
                .HasColumnName("EMAIL");

            entity.Property(e => e.Dob)
                .HasColumnType("datetime")
                .HasColumnName("DOB");
            entity.Property(e => e.FirstName)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("FIRST_NAME");
            entity.Property(e => e.JoinDate)
                .HasColumnType("datetime")
                .HasColumnName("JOIN_DATE");
            entity.Property(e => e.LastName)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("LAST_NAME");
            entity.Property(e => e.Phone)
                .HasMaxLength(12)
                .IsUnicode(false)
                .HasColumnName("PHONE");
            entity.Property(e => e.Position)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("POSITION");
            entity.Property(e => e.Sex)
                .HasColumnType("tinyint")
                .HasColumnName("SEX");
        });

        modelBuilder.Entity<StaffTeam>(entity =>
        {
            entity.ToTable("STAFF_TEAM");

            entity.HasIndex(e => e.StaffId, "STAFF_INDX");

            entity.HasIndex(e => e.TeamId, "TEAM_INDX");

            entity.Property(e => e.StaffTeamId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("STAFF_TEAM_ID");
            entity.Property(e => e.StaffId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("STAFF_ID");
            entity.Property(e => e.TeamId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("TEAM_ID");
            entity.Property(e => e.FollowsTeamSchedule)
                .HasDefaultValue(true)
                .HasColumnName("FOLLOWS_TEAM_SCHEDULE");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffTeams)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("FK_STAFF_TE_REFERENCE_STAFF");

            entity.HasOne(d => d.Team).WithMany(p => p.StaffTeams)
                .HasForeignKey(d => d.TeamId)
                .HasConstraintName("FK_STAFF_TE_REFERENCE_TEAM");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.ToTable("TEAM");

            entity.HasIndex(e => e.TeamName, "TEAM_NAME_INDX");

            entity.Property(e => e.TeamId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("TEAM_ID");
            entity.Property(e => e.Created)
                .HasColumnType("datetime")
                .HasColumnName("CREATED");
            entity.Property(e => e.TeamName)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("TEAM_NAME");
        });

        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.ToTable("TICKET");

            entity.HasIndex(e => e.StaffId, "STAFF_INDX");

            entity.HasIndex(e => e.Title, "TITLE_INDX");

            entity.Property(e => e.TicketId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("TICKET_ID");
            entity.Property(e => e.StartDate)
                .HasColumnType("datetime")
                .HasColumnName("START_DATE");
            entity.Property(e => e.EndDate)
                .HasColumnType("datetime")
                .HasColumnName("END_DATE");
            entity.Property(e => e.Description)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("DESCRIPTION");
            entity.Property(e => e.Reason)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("REASON");
            entity.Property(e => e.StaffId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("STAFF_ID");
            entity.Property(e => e.Status)
                .HasMaxLength(1)
                .IsUnicode(false)
                .HasColumnType("tinyint")
                .HasColumnName("STATUS");
            entity.Property(e => e.Title)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("TITLE");
            entity.Property(e => e.Type)
                .HasMaxLength(1)
                .IsUnicode(false)
                .HasColumnType("tinyint")
                .HasColumnName("TYPE");

            entity.HasOne(d => d.Staff).WithMany(p => p.Tickets)
                .HasForeignKey(d => d.StaffId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_TICKET_REFERENCE_STAFF");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("USER");

            entity.HasIndex(e => e.Email, "EMAIL_INDX");

            entity.Property(e => e.UserId)
                .HasMaxLength(36)
                .IsUnicode(false)
                .HasColumnName("USER_ID");
            entity.Property(e => e.Created)
                .HasColumnType("datetime")
                .HasColumnName("CREATED");
            entity.Property(e => e.Email)
                .HasMaxLength(70)
                .IsUnicode(false)
                .HasColumnName("EMAIL");
            entity.Property(e => e.Locked).HasColumnName("LOCKED");
            entity.Property(e => e.Password)
                .HasMaxLength(60)
                .IsUnicode(false)
                .HasColumnName("PASSWORD");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}