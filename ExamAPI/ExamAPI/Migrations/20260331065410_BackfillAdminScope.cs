using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class BackfillAdminScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE Users
SET IsActive = 1
WHERE IsActive = 0;

UPDATE Users
SET CreatedAt = SYSUTCDATETIME()
WHERE CreatedAt = '0001-01-01T00:00:00.0000000';

UPDATE Users
SET Email = CONCAT(Username, '@example.com')
WHERE Email IS NULL OR LTRIM(RTRIM(Email)) = '';

UPDATE Tests
SET AdminId = 1
WHERE AdminId IS NULL;

UPDATE Questions
SET AdminId = 1
WHERE AdminId IS NULL;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE Tests
SET AdminId = NULL
WHERE AdminId = 1;

UPDATE Questions
SET AdminId = NULL
WHERE AdminId = 1;
");
        }
    }
}
