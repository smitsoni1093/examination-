using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AllowDuplicateMobileNumbers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_MobileNumber",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 20, 8, 57, 30, 914, DateTimeKind.Utc).AddTicks(3259), "$2a$11$iJAqjWkeOA0zXvPgxih0Pee74T3BaQx..2/W2X3Wb2lXNHcggHVJi" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 20, 6, 23, 54, 467, DateTimeKind.Utc).AddTicks(4498), "$2a$11$tW4QIN4gC..vEba4qg9ktuHriKFdhKT1S3i1E4GfTM1qStmChlB.e" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_MobileNumber",
                table: "Users",
                column: "MobileNumber",
                unique: true,
                filter: "[MobileNumber] IS NOT NULL");
        }
    }
}
