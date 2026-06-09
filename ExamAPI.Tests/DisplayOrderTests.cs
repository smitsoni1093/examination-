using System.Reflection;
using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using ExamAPI.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ExamAPI.Tests;

public class DisplayOrderTests
{
    private static (AppDbContext Db, SqliteConnection Connection) CreateDbContext()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return (db, connection);
    }

    private static AdminService CreateAdminService(AppDbContext db)
    {
        var classService = new ClassService(db);
        var emailService = new FakeEmailService();
        var configuration = new ConfigurationBuilder().Build();
        var cache = new MemoryCache(new MemoryCacheOptions());

        return new AdminService(db, classService, emailService, configuration, cache, NullLogger<AdminService>.Instance);
    }

    private static Question CreateQuestion(int displayOrder, int? adminId = null, string? sourceFileName = null)
    {
        return new Question
        {
            Question_EN = $"Question {displayOrder}",
            Option1_EN = "A1",
            Option2_EN = "A2",
            Option3_EN = "A3",
            Option4_EN = "A4",
            Question_HI = "QH",
            Option1_HI = "H1",
            Option2_HI = "H2",
            Option3_HI = "H3",
            Option4_HI = "H4",
            Question_GU = "QG",
            Option1_GU = "G1",
            Option2_GU = "G2",
            Option3_GU = "G3",
            Option4_GU = "G4",
            CorrectOption = 1,
            DisplayOrder = displayOrder,
            AdminId = adminId,
            SourceFileName = sourceFileName ?? string.Empty,
            CreatedAt = DateTime.UtcNow.AddMinutes(displayOrder)
        };
    }

    private static Test CreateTest(int id = 1, int? adminId = null)
    {
        return new Test
        {
            Id = id,
            Name = "Sample Test",
            Description = "Demo",
            Duration = 30,
            TotalMarks = 100,
            AdminId = adminId,
            IsActive = true,
            IsDeleted = false,
            IsGlobal = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetQuestionsAsync_returns_questions_sorted_by_display_order()
    {
        var (db, connection) = CreateDbContext();
        await using var _ = connection;
        db.Questions.AddRange(
            CreateQuestion(30),
            CreateQuestion(10),
            CreateQuestion(20));
        await db.SaveChangesAsync();

        var service = CreateAdminService(db);

        var questions = await service.GetQuestionsAsync();

        Assert.Equal(new[] { 10, 20, 30 }, questions.Select(q => q.DisplayOrder).ToArray());
    }

    [Fact]
    public async Task CreateQuestionAsync_assigns_next_display_order()
    {
        var (db, connection) = CreateDbContext();
        await using var _ = connection;
        db.Questions.AddRange(CreateQuestion(1), CreateQuestion(2));
        await db.SaveChangesAsync();

        var service = CreateAdminService(db);
        var created = await service.CreateQuestionAsync(null, new CreateQuestionDto(
            "New question",
            "A1",
            "A2",
            "A3",
            "A4",
            "QH",
            "H1",
            "H2",
            "H3",
            "H4",
            "QG",
            "G1",
            "G2",
            "G3",
            "G4",
            1));

        Assert.Equal(3, created.DisplayOrder);
    }

    [Fact]
    public async Task AssignQuestionsAsync_orders_questions_by_display_order()
    {
        var (db, connection) = CreateDbContext();
        await using var _ = connection;
        db.Questions.AddRange(
            CreateQuestion(30),
            CreateQuestion(10),
            CreateQuestion(20));
        db.Tests.Add(CreateTest());
        await db.SaveChangesAsync();

        var service = CreateAdminService(db);
        var expectedIds = await db.Questions
            .OrderBy(q => q.DisplayOrder)
            .Select(q => q.Id)
            .ToListAsync();

        await service.AssignQuestionsAsync(new AssignQuestionsDto(1, expectedIds.AsEnumerable().Reverse().ToList()));

        var assignedIds = await db.TestQuestions
            .OrderBy(tq => tq.OrderIndex)
            .Select(tq => tq.QuestionId)
            .ToListAsync();

        Assert.Equal(expectedIds, assignedIds);
    }

    [Fact]
    public void MapQuestionImportRow_uses_qno_as_display_order_when_available()
    {
        var (db, connection) = CreateDbContext();
        using var _ = connection;
        var service = CreateAdminService(db);

        var mapping = new QuestionImportMappingDto(1, 2, 3, 4, 5, 6, 7);
        var rowValues = new[] { "7", "What is 2+2?", "4", "3", "2", "1", "A" };

        var method = typeof(AdminService).GetMethod("MapQuestionImportRow", BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(method);

        var result = method!.Invoke(service, new object?[] { 8, rowValues, mapping, "import.xlsx", null });
        Assert.NotNull(result);

        var questionProperty = result!.GetType().GetProperty("Question", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        Assert.NotNull(questionProperty);

        var question = questionProperty!.GetValue(result) as Question;
        Assert.NotNull(question);
        Assert.Equal(7, question!.DisplayOrder);
    }

    private sealed class FakeEmailService : IEmailService
    {
        public Task SendInviteAsync(string toEmail, string fullName, string username, string inviteLink)
            => Task.CompletedTask;
    }
}
