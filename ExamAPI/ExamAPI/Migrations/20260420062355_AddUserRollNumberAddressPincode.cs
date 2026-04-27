using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRollNumberAddressPincode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pincode",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RollNumber",
                table: "Users",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Address", "CreatedAt", "PasswordHash", "Pincode", "RollNumber" },
                values: new object[] { null, new DateTime(2026, 4, 20, 6, 23, 54, 467, DateTimeKind.Utc).AddTicks(4498), "$2a$11$tW4QIN4gC..vEba4qg9ktuHriKFdhKT1S3i1E4GfTM1qStmChlB.e", null, null });

            migrationBuilder.CreateIndex(
                name: "IX_Users_RollNumber",
                table: "Users",
                column: "RollNumber",
                unique: true,
                filter: "[RollNumber] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_RollNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Pincode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RollNumber",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 17, 12, 33, 10, 733, DateTimeKind.Utc).AddTicks(4376), "$2a$11$jgs0ApCtBE8/LXbVFaXwreTxiNsZk72IH5O2FZ4uWzzV/ypUQyzwa" });
        }
    }
}
