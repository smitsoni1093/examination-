using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    public partial class AddQuestionDisplayOrder : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Questions",
                type: "int",
                nullable: false,
                defaultValue: 0);

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

            migrationBuilder.CreateIndex(
                name: "IX_Questions_AdminId_DisplayOrder",
                table: "Questions",
                columns: new[] { "AdminId", "DisplayOrder" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Questions_AdminId_DisplayOrder",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Questions");
        }
    }
}