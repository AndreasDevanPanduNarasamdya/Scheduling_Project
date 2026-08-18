using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchedulingMeruap.Api.Migrations
{
    /// <inheritdoc />
    public partial class NewTableHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DUTY_STATUS",
                table: "ACTIVITY_LOG");

            migrationBuilder.DropColumn(
                name: "REASON",
                table: "ACTIVITY_LOG");

            migrationBuilder.DropColumn(
                name: "SOURCE_DETAIL",
                table: "ACTIVITY_LOG");

            migrationBuilder.DropColumn(
                name: "SOURCE_TYPE",
                table: "ACTIVITY_LOG");

            migrationBuilder.AlterColumn<string>(
                name: "DESCRIPTION",
                table: "ACTIVITY_LOG",
                type: "varchar(500)",
                unicode: false,
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ACTION_TYPE",
                table: "ACTIVITY_LOG",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "DESCRIPTION",
                table: "ACTIVITY_LOG",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldUnicode: false,
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "ACTION_TYPE",
                table: "ACTIVITY_LOG",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldUnicode: false,
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "DUTY_STATUS",
                table: "ACTIVITY_LOG",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "REASON",
                table: "ACTIVITY_LOG",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SOURCE_DETAIL",
                table: "ACTIVITY_LOG",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SOURCE_TYPE",
                table: "ACTIVITY_LOG",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: false,
                defaultValue: "");
        }
    }
}
