using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTestImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TestImageUrl",
                table: "Tests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 22, 9, 56, 34, 179, DateTimeKind.Utc).AddTicks(3897), "$2a$11$aywIWgwcbXM4ezL9ifD2q.H5mPtpwzNsU.Edr2ACE9xvOKYcMsJsW" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TestImageUrl",
                table: "Tests");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 20, 8, 57, 30, 914, DateTimeKind.Utc).AddTicks(3259), "$2a$11$iJAqjWkeOA0zXvPgxih0Pee74T3BaQx..2/W2X3Wb2lXNHcggHVJi" });
        }
    }
}
