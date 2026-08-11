using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchedulingMeruap.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRotationPatternRemoveScheduleShiftNEW : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ROTATION_PATTERN",
                table: "ROTATION_PATTERN");

            migrationBuilder.RenameTable(
                name: "ROTATION_PATTERN",
                newName: "TIMELINE");

            migrationBuilder.RenameColumn(
                name: "ROTATION_PATTERN_ID",
                table: "TIMELINE",
                newName: "TIMELINE_ID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TIMELINE",
                table: "TIMELINE",
                column: "TIMELINE_ID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_TIMELINE",
                table: "TIMELINE");

            migrationBuilder.RenameTable(
                name: "TIMELINE",
                newName: "ROTATION_PATTERN");

            migrationBuilder.RenameColumn(
                name: "TIMELINE_ID",
                table: "ROTATION_PATTERN",
                newName: "ROTATION_PATTERN_ID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ROTATION_PATTERN",
                table: "ROTATION_PATTERN",
                column: "ROTATION_PATTERN_ID");
        }
    }
}
