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
            entity.Property(e => e.ColorTheme)
                .HasMaxLength(7)
                .IsUnicode(false)
                .HasColumnName("COLOR_THEME");

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
            entity.ToTable("ACTIVITY_LOG");
            entity.HasKey(e => e.LogId);

            entity.Property(e => e.LogId).HasMaxLength(36).IsUnicode(false).HasColumnName("LOG_ID").IsRequired();
            entity.Property(e => e.Date).HasColumnType("date").HasColumnName("DATE").IsRequired();
            entity.Property(e => e.Time).HasColumnType("time").HasColumnName("TIME").IsRequired();
            entity.Property(e => e.Actor).HasMaxLength(150).HasColumnName("ACTOR").IsRequired();
            entity.Property(e => e.Action).HasColumnType("tinyint").HasColumnName("ACTION").IsRequired();
            entity.Property(e => e.Target).HasMaxLength(150).HasColumnName("TARGET").IsRequired();
            entity.Property(e => e.Type).HasColumnType("tinyint").HasColumnName("TYPE");
            entity.Property(e => e.Edit).HasMaxLength(4000).HasColumnName("EDIT");
            entity.Property(e => e.RangeStart).HasColumnType("date").HasColumnName("RANGE_START");
            entity.Property(e => e.RangeEnd).HasColumnType("date").HasColumnName("RANGE_END");
            entity.Property(e => e.Rotation).HasMaxLength(50).IsUnicode(false).HasColumnName("ROTATION");
            entity.Property(e => e.Description).HasMaxLength(500).HasColumnName("DESCRIPTION");
        });

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

            // 🔥 FIXED: Status
            entity.Property(e => e.Status)
                .HasColumnType("tinyint")
                .HasColumnName("STATUS");

            entity.Property(e => e.Title)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("TITLE");

            // 🔥 FIXED: Type
            entity.Property(e => e.Type)
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

            entity.Property(e => e.Clearance)
                .HasColumnType("tinyint")
                .HasColumnName("CLEARANCE")
                .IsRequired();

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