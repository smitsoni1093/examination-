using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    public partial class AddQuestionDisplayOrder : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('Questions', 'DisplayOrder') IS NULL
BEGIN
    ALTER TABLE Questions ADD DisplayOrder int NOT NULL CONSTRAINT DF_Questions_DisplayOrder DEFAULT(0);
END;
");

            migrationBuilder.Sql(@"
;WITH OrderedQuestions AS
(
    SELECT
        Id,
        ROW_NUMBER() OVER
        (
            ORDER BY CreatedAt, Id
        ) AS Seq
    FROM Questions
)
UPDATE q
SET DisplayOrder = o.Seq
FROM Questions q
INNER JOIN OrderedQuestions o
ON q.Id = o.Id;
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Questions_AdminId_DisplayOrder'
      AND object_id = OBJECT_ID('Questions')
)
BEGIN
    CREATE INDEX IX_Questions_AdminId_DisplayOrder ON Questions (AdminId, DisplayOrder);
END;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Questions_AdminId_DisplayOrder'
      AND object_id = OBJECT_ID('Questions')
)
BEGIN
    DROP INDEX IX_Questions_AdminId_DisplayOrder ON Questions;
END;
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('Questions', 'DisplayOrder') IS NOT NULL
BEGIN
    ALTER TABLE Questions DROP COLUMN DisplayOrder;
END;
");
        }
    }
}