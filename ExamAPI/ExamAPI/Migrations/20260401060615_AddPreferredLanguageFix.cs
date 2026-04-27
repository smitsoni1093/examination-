using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPreferredLanguageFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreferredLanguage",
                table: "Users",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash", "PreferredLanguage" },
                values: new object[] { new DateTime(2026, 4, 1, 6, 6, 14, 957, DateTimeKind.Utc).AddTicks(8485), "$2a$11$06cGk2Om0YyYPIdfTOlkh.ICj0d8hQgPqkWtD5DJcn1ddzQ7qCucy", "en" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredLanguage",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 10, 28, 16, 23, DateTimeKind.Utc).AddTicks(2791), "$2a$11$ubROTTCyu4JmRb63kHLdkeJWmGSDLbOhgNUeIadinjI/j4ys6XHqK" });
        }
    }
}
