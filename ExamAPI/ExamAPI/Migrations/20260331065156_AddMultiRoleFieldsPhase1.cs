using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiRoleFieldsPhase1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AdminId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "AdminId",
                table: "Tests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AdminId",
                table: "Questions",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AdminId", "CreatedAt", "Email", "IsActive", "PasswordHash" },
                values: new object[] { null, new DateTime(2026, 3, 31, 6, 51, 56, 28, DateTimeKind.Utc).AddTicks(7994), "admin@example.com", true, "$2a$11$8mT0qOHTfPt06wXcnkkKfOCwU51jLjbUszAqSHe.2hT.NDulAEU9W" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_AdminId",
                table: "Users",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Tests_AdminId",
                table: "Tests",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_AdminId",
                table: "Questions",
                column: "AdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Users_AdminId",
                table: "Questions",
                column: "AdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tests_Users_AdminId",
                table: "Tests",
                column: "AdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_AdminId",
                table: "Users",
                column: "AdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Users_AdminId",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_Tests_Users_AdminId",
                table: "Tests");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_AdminId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_AdminId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Tests_AdminId",
                table: "Tests");

            migrationBuilder.DropIndex(
                name: "IX_Questions_AdminId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "AdminId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AdminId",
                table: "Tests");

            migrationBuilder.DropColumn(
                name: "AdminId",
                table: "Questions");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$q55eNazaqz9BsaADNHvsJeGpbnlyqKL7u.kk6G4/J4PynCLQyM33.");
        }
    }
}
