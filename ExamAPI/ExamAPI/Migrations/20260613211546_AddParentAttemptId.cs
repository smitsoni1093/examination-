using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddParentAttemptId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentAttemptId",
                table: "TestAttempts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TestAttempts_ParentAttemptId",
                table: "TestAttempts",
                column: "ParentAttemptId");

            migrationBuilder.AddForeignKey(
                name: "FK_TestAttempts_TestAttempts_ParentAttemptId",
                table: "TestAttempts",
                column: "ParentAttemptId",
                principalTable: "TestAttempts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TestAttempts_TestAttempts_ParentAttemptId",
                table: "TestAttempts");

            migrationBuilder.DropIndex(
                name: "IX_TestAttempts_ParentAttemptId",
                table: "TestAttempts");

            migrationBuilder.DropColumn(
                name: "ParentAttemptId",
                table: "TestAttempts");
        }
    }
}
