using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchedulingMeruap.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNewHireTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NEW_HIRE",
                columns: table => new
                {
                    NEW_HIRE_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    ACTIVATION_TOKEN = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    TOKEN_EXPIRY = table.Column<DateTime>(type: "datetime", nullable: false),
                    FIRST_NAME = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    LAST_NAME = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    EMAIL = table.Column<string>(type: "varchar(70)", unicode: false, maxLength: 70, nullable: false),
                    SEX = table.Column<byte>(type: "tinyint", nullable: false),
                    POSITION = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    PHONE = table.Column<string>(type: "varchar(12)", unicode: false, maxLength: 12, nullable: false),
                    JOIN_DATE = table.Column<DateTime>(type: "datetime", nullable: false),
                    DOB = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NEW_HIRE", x => x.NEW_HIRE_ID);
                });

            migrationBuilder.CreateTable(
                name: "SCHEDULE",
                columns: table => new
                {
                    SCHEDULE_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    DATE = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SCHEDULE", x => x.SCHEDULE_ID);
                });

            migrationBuilder.CreateTable(
                name: "TEAM",
                columns: table => new
                {
                    TEAM_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    TEAM_NAME = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    CREATED = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TEAM", x => x.TEAM_ID);
                });

            migrationBuilder.CreateTable(
                name: "USER",
                columns: table => new
                {
                    USER_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    EMAIL = table.Column<string>(type: "varchar(70)", unicode: false, maxLength: 70, nullable: false),
                    PASSWORD = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: false),
                    CREATED = table.Column<DateTime>(type: "datetime", nullable: false),
                    LOCKED = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USER", x => x.USER_ID);
                });

            migrationBuilder.CreateTable(
                name: "ACTIVITY_LOG",
                columns: table => new
                {
                    LOG_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    SCHEDULE_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    FIRST_NAME = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    LAST_NAME = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    POSITION = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    TEAM = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    TYPE = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: false),
                    DESCRIPTION = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    DOCUMENT = table.Column<string>(type: "varchar(70)", unicode: false, maxLength: 70, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ACTIVITY_LOG", x => x.LOG_ID);
                    table.ForeignKey(
                        name: "FK_ACTIVITY_REFERENCE_SCHEDULE",
                        column: x => x.SCHEDULE_ID,
                        principalTable: "SCHEDULE",
                        principalColumn: "SCHEDULE_ID");
                });

            migrationBuilder.CreateTable(
                name: "SHIFT",
                columns: table => new
                {
                    SHIFT_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    SCHEDULE_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    TEAM_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SHIFT", x => x.SHIFT_ID);
                    table.ForeignKey(
                        name: "FK_SHIFT_REFERENCE_SCHEDULE",
                        column: x => x.SCHEDULE_ID,
                        principalTable: "SCHEDULE",
                        principalColumn: "SCHEDULE_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SHIFT_REFERENCE_TEAM",
                        column: x => x.TEAM_ID,
                        principalTable: "TEAM",
                        principalColumn: "TEAM_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "STAFF",
                columns: table => new
                {
                    STAFF_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    USER_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: true),
                    FIRST_NAME = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    LAST_NAME = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    SEX = table.Column<byte>(type: "tinyint", nullable: false),
                    POSITION = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    PHONE = table.Column<string>(type: "varchar(12)", unicode: false, maxLength: 12, nullable: false),
                    JOIN_DATE = table.Column<DateTime>(type: "datetime", nullable: false),
                    DOB = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_STAFF", x => x.STAFF_ID);
                    table.ForeignKey(
                        name: "FK_STAFF_REFERENCE_USER",
                        column: x => x.USER_ID,
                        principalTable: "USER",
                        principalColumn: "USER_ID");
                });

            migrationBuilder.CreateTable(
                name: "STAFF_TEAM",
                columns: table => new
                {
                    STAFF_TEAM_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    TEAM_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    STAFF_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_STAFF_TEAM", x => x.STAFF_TEAM_ID);
                    table.ForeignKey(
                        name: "FK_STAFF_TE_REFERENCE_STAFF",
                        column: x => x.STAFF_ID,
                        principalTable: "STAFF",
                        principalColumn: "STAFF_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_STAFF_TE_REFERENCE_TEAM",
                        column: x => x.TEAM_ID,
                        principalTable: "TEAM",
                        principalColumn: "TEAM_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TICKET",
                columns: table => new
                {
                    TICKET_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: false),
                    STAFF_ID = table.Column<string>(type: "varchar(36)", unicode: false, maxLength: 36, nullable: true),
                    START_DATE = table.Column<DateTime>(type: "datetime", nullable: false),
                    END_DATE = table.Column<DateTime>(type: "datetime", nullable: false),
                    TYPE = table.Column<byte>(type: "tinyint", unicode: false, maxLength: 1, nullable: false),
                    STATUS = table.Column<byte>(type: "tinyint", unicode: false, maxLength: 1, nullable: false),
                    TITLE = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    DESCRIPTION = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    REASON = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TICKET", x => x.TICKET_ID);
                    table.ForeignKey(
                        name: "FK_TICKET_REFERENCE_STAFF",
                        column: x => x.STAFF_ID,
                        principalTable: "STAFF",
                        principalColumn: "STAFF_ID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "SCHEDULE_INDX",
                table: "ACTIVITY_LOG",
                column: "SCHEDULE_ID");

            migrationBuilder.CreateIndex(
                name: "ACTIVATION_TOKEN_INDX",
                table: "NEW_HIRE",
                column: "ACTIVATION_TOKEN",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "FIRST_NAME_INDX",
                table: "NEW_HIRE",
                column: "FIRST_NAME");

            migrationBuilder.CreateIndex(
                name: "LAST_NAME_INDX",
                table: "NEW_HIRE",
                column: "LAST_NAME");

            migrationBuilder.CreateIndex(
                name: "POSITON_INDX",
                table: "NEW_HIRE",
                column: "POSITION");

            migrationBuilder.CreateIndex(
                name: "DATE_INDX",
                table: "SCHEDULE",
                column: "DATE");

            migrationBuilder.CreateIndex(
                name: "SCHEDULE_INDX",
                table: "SHIFT",
                column: "SCHEDULE_ID");

            migrationBuilder.CreateIndex(
                name: "TEAM_INDX",
                table: "SHIFT",
                column: "TEAM_ID");

            migrationBuilder.CreateIndex(
                name: "FIRST_NAME_INDX",
                table: "STAFF",
                column: "FIRST_NAME");

            migrationBuilder.CreateIndex(
                name: "LAST_NAME_INDX",
                table: "STAFF",
                column: "LAST_NAME");

            migrationBuilder.CreateIndex(
                name: "POSITON_INDX",
                table: "STAFF",
                column: "POSITION");

            migrationBuilder.CreateIndex(
                name: "USER_INDX",
                table: "STAFF",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "STAFF_INDX",
                table: "STAFF_TEAM",
                column: "STAFF_ID");

            migrationBuilder.CreateIndex(
                name: "TEAM_INDX",
                table: "STAFF_TEAM",
                column: "TEAM_ID");

            migrationBuilder.CreateIndex(
                name: "TEAM_NAME_INDX",
                table: "TEAM",
                column: "TEAM_NAME");

            migrationBuilder.CreateIndex(
                name: "STAFF_INDX",
                table: "TICKET",
                column: "STAFF_ID");

            migrationBuilder.CreateIndex(
                name: "TITLE_INDX",
                table: "TICKET",
                column: "TITLE");

            migrationBuilder.CreateIndex(
                name: "EMAIL_INDX",
                table: "USER",
                column: "EMAIL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ACTIVITY_LOG");

            migrationBuilder.DropTable(
                name: "NEW_HIRE");

            migrationBuilder.DropTable(
                name: "SHIFT");

            migrationBuilder.DropTable(
                name: "STAFF_TEAM");

            migrationBuilder.DropTable(
                name: "TICKET");

            migrationBuilder.DropTable(
                name: "SCHEDULE");

            migrationBuilder.DropTable(
                name: "TEAM");

            migrationBuilder.DropTable(
                name: "STAFF");

            migrationBuilder.DropTable(
                name: "USER");
        }
    }
}
