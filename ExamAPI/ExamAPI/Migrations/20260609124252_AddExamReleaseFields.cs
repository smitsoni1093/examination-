using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddExamReleaseFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsReleased",
                table: "TestAttempts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_TestAttempts_UserId_TestId_IsSubmitted_IsReleased",
                table: "TestAttempts",
                columns: new[] { "UserId", "TestId", "IsSubmitted", "IsReleased" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TestAttempts_UserId_TestId_IsSubmitted_IsReleased",
                table: "TestAttempts");

            migrationBuilder.DropColumn(
                name: "IsReleased",
                table: "TestAttempts");
        }
    }
}
