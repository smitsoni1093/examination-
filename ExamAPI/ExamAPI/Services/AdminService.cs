using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Services
{
    public class AdminService
    {
        private readonly AppDbContext _db;

        public AdminService(AppDbContext db) => _db = db;

        // ── Users ──────────────────────────────────────────────────────────────

        public async Task<User> CreateUserAsync(CreateUserDto dto)
        {
            if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
                throw new InvalidOperationException($"Username '{dto.Username}' is already taken.");

            var user = new User
            {
                Name = dto.Name,
                Username = dto.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "User"
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return user;
        }

        public async Task<List<User>> GetUsersAsync() =>
            await _db.Users.Where(u => u.Role == "User").ToListAsync();

        // ── Questions ──────────────────────────────────────────────────────────

        public async Task<Question> CreateQuestionAsync(CreateQuestionDto dto)
        {
            if (dto.CorrectOption < 1 || dto.CorrectOption > 4)
                throw new ArgumentException("CorrectOption must be between 1 and 4.");

            var q = new Question
            {
                Question_EN = dto.Question_EN, Option1_EN = dto.Option1_EN, Option2_EN = dto.Option2_EN,
                Option3_EN = dto.Option3_EN, Option4_EN = dto.Option4_EN,
                Question_HI = dto.Question_HI, Option1_HI = dto.Option1_HI, Option2_HI = dto.Option2_HI,
                Option3_HI = dto.Option3_HI, Option4_HI = dto.Option4_HI,
                Question_GU = dto.Question_GU, Option1_GU = dto.Option1_GU, Option2_GU = dto.Option2_GU,
                Option3_GU = dto.Option3_GU, Option4_GU = dto.Option4_GU,
                CorrectOption = dto.CorrectOption
            };
            _db.Questions.Add(q);
            await _db.SaveChangesAsync();
            return q;
        }

        public async Task<List<Question>> GetQuestionsAsync() =>
            await _db.Questions.ToListAsync();

        // ── Tests ──────────────────────────────────────────────────────────────

        public async Task<Test> CreateTestAsync(CreateTestDto dto)
        {
            var test = new Test { Name = dto.Name, Duration = dto.Duration };
            _db.Tests.Add(test);
            await _db.SaveChangesAsync();
            return test;
        }

        public async Task AssignQuestionsAsync(AssignQuestionsDto dto)
        {
            var test = await _db.Tests.FindAsync(dto.TestId)
                ?? throw new KeyNotFoundException($"Test {dto.TestId} not found.");

            // Remove existing assignments
            var existing = _db.TestQuestions.Where(tq => tq.TestId == dto.TestId);
            _db.TestQuestions.RemoveRange(existing);

            // Assign new questions with order
            var assignments = dto.QuestionIds.Select((qId, index) => new TestQuestion
            {
                TestId = dto.TestId,
                QuestionId = qId,
                OrderIndex = index + 1
            });

            await _db.TestQuestions.AddRangeAsync(assignments);
            await _db.SaveChangesAsync();
        }

        // ── Results ────────────────────────────────────────────────────────────

        public async Task<List<ResultDto>> GetAllResultsAsync()
        {
            return await _db.Results
            .OrderByDescending(r => r.SubmittedAt)
            .Select(r => new ResultDto(
                r.UserId,
                r.User.Name,
                r.TestId,
                r.Test.Name,
                r.Score,
                r.TotalQuestions,
                r.SubmittedAt
            ))
            .ToListAsync();
        }
    }
}
