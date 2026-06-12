using Microsoft.EntityFrameworkCore.Migrations;

namespace ExamAPI.Migrations
{
    public partial class AddParentAttempt : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add ParentAttemptId column if it doesn't already exist
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TestAttempts' AND COLUMN_NAME = 'ParentAttemptId')
BEGIN
    ALTER TABLE [TestAttempts] ADD [ParentAttemptId] int NULL;
END
");
            // Optional: no foreign key to avoid cross-environment issues
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TestAttempts' AND COLUMN_NAME = 'ParentAttemptId')
BEGIN
    ALTER TABLE [TestAttempts] DROP COLUMN [ParentAttemptId];
END
");
        }
    }
}
