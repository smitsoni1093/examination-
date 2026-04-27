using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class SeedSuperAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'superadmin')
BEGIN
    INSERT INTO Users (Name, Username, PasswordHash, Role, Email, CreatedAt, IsActive, AdminId)
    SELECT
        'Super Admin',
        'superadmin',
        (SELECT TOP 1 PasswordHash FROM Users WHERE Username = 'admin'),
        'SuperAdmin',
        'superadmin@example.com',
        SYSUTCDATETIME(),
        1,
        NULL;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM Users WHERE Username = 'superadmin' AND Role = 'SuperAdmin';
");
        }
    }
}
