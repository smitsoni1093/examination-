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
            // Add IsReleased column if it doesn't already exist
            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'TestAttempts' AND COLUMN_NAME = 'IsReleased')
                BEGIN
                    ALTER TABLE [TestAttempts] ADD [IsReleased] bit NOT NULL DEFAULT CAST(0 AS bit);
                END");

            // Create index only if it doesn't exist
            migrationBuilder.Sql(
                @"IF NOT EXISTS (SELECT 1 FROM sys.indexes 
                    WHERE name = 'IX_TestAttempts_UserId_TestId_IsSubmitted_IsReleased')
                BEGIN
                    CREATE INDEX [IX_TestAttempts_UserId_TestId_IsSubmitted_IsReleased] 
                    ON [TestAttempts]([UserId], [TestId], [IsSubmitted], [IsReleased]);
                END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop index if it exists
            migrationBuilder.Sql(
                @"IF EXISTS (SELECT 1 FROM sys.indexes 
                    WHERE name = 'IX_TestAttempts_UserId_TestId_IsSubmitted_IsReleased')
                BEGIN
                    DROP INDEX [IX_TestAttempts_UserId_TestId_IsSubmitted_IsReleased] ON [TestAttempts];
                END");

            // Drop column if it exists
            migrationBuilder.Sql(
                @"IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'TestAttempts' AND COLUMN_NAME = 'IsReleased')
                BEGIN
                    ALTER TABLE [TestAttempts] DROP COLUMN [IsReleased];
                END");
        }
    }
}
