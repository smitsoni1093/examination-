using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Services
{
    public class UserService
    {
        private readonly AppDbContext _db;

        public UserService(AppDbContext db) => _db = db;
        
        /// <summary>Lists all tests available in the system with user's specific status (completed, score, etc.)</summary>
        public async Task<List<UserTestStatusDto>> GetAvailableTestsAsync(int userId)
        {
            var tests = await _db.Tests
                .Include(t => t.TestQuestions)
                .ToListAsync();

            var results = await _db.Results
                .Where(r => r.UserId == userId)
                .ToDictionaryAsync(r => r.TestId);

            return tests.Select(t => new UserTestStatusDto(
                t.Id,
                t.Name,
                t.Duration,
                t.TestQuestions.Count,
                results.TryGetValue(t.Id, out var r) ? true : false,
                results.TryGetValue(t.Id, out var res) ? (int?)res.Score : null
            )).ToList();
        }

        /// <summary>Get a test with all its questions (excluding correct answers) and any saved answers</summary>
        public async Task<TestDto?> GetTestAsync(int testId, int userId)
        {
            var test = await _db.Tests
                .Include(t => t.TestQuestions)
                    .ThenInclude(tq => tq.Question)
                .FirstOrDefaultAsync(t => t.Id == testId);

            if (test == null) return null;

            var savedAnswers = await _db.UserAnswers
                .Where(ua => ua.UserId == userId && ua.TestId == testId)
                .ToDictionaryAsync(ua => ua.QuestionId, ua => ua.SelectedOption);

            var questions = test.TestQuestions
                .OrderBy(tq => tq.OrderIndex)
                .Select(tq => new QuestionDto(
                    tq.Question.Id, tq.OrderIndex,
                    tq.Question.Question_EN, tq.Question.Option1_EN, tq.Question.Option2_EN,
                    tq.Question.Option3_EN, tq.Question.Option4_EN,
                    tq.Question.Question_HI, tq.Question.Option1_HI, tq.Question.Option2_HI,
                    tq.Question.Option3_HI, tq.Question.Option4_HI,
                    tq.Question.Question_GU, tq.Question.Option1_GU, tq.Question.Option2_GU,
                    tq.Question.Option3_GU, tq.Question.Option4_GU
                ))
                .ToList();

            return new TestDto(test.Id, test.Name, test.Duration, questions, savedAnswers);
        }

        /// <summary>Auto-save a single answer (upsert pattern)</summary>
        public async Task SaveAnswerAsync(int userId, SubmitAnswerDto dto)
        {
            // Prevent saving if test is already submitted
            if (await _db.Results.AnyAsync(r => r.UserId == userId && r.TestId == dto.TestId))
                throw new InvalidOperationException("Test already submitted. Cannot modify answers.");

            var existing = await _db.UserAnswers
                .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.TestId == dto.TestId && ua.QuestionId == dto.QuestionId);

            if (existing != null)
            {
                existing.SelectedOption = dto.SelectedOption;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.UserAnswers.Add(new UserAnswer
                {
                    UserId = userId,
                    TestId = dto.TestId,
                    QuestionId = dto.QuestionId,
                    SelectedOption = dto.SelectedOption
                });
            }

            await _db.SaveChangesAsync();
        }

        /// <summary>Calculate score, store result, and return it. Idempotent — if already submitted, returns existing result.</summary>
        public async Task<ResultDto> SubmitTestAsync(int userId, SubmitTestDto dto)
        {
            // Prevent re-submission
            var existing = await _db.Results
                .Include(r => r.User)
                .Include(r => r.Test)
                .FirstOrDefaultAsync(r => r.UserId == userId && r.TestId == dto.TestId);

            if (existing != null)
                return new ResultDto(existing.UserId, existing.User.Name, existing.TestId,
                    existing.Test.Name, existing.Score, existing.TotalQuestions, existing.SubmittedAt);

            // Fetch questions with correct answers
            var testQuestions = await _db.TestQuestions
                .Include(tq => tq.Question)
                .Where(tq => tq.TestId == dto.TestId)
                .ToListAsync();

            var userAnswers = await _db.UserAnswers
                .Where(ua => ua.UserId == userId && ua.TestId == dto.TestId)
                .ToDictionaryAsync(ua => ua.QuestionId, ua => ua.SelectedOption);

            // Calculate score: 1 mark per correct, 0 for wrong/unanswered
            int score = testQuestions.Count(tq =>
                userAnswers.TryGetValue(tq.QuestionId, out var selected) &&
                selected == tq.Question.CorrectOption);

            var test = await _db.Tests.FindAsync(dto.TestId);
            var user = await _db.Users.FindAsync(userId);

            var result = new Result
            {
                UserId = userId,
                TestId = dto.TestId,
                Score = score,
                TotalQuestions = testQuestions.Count,
                SubmittedAt = DateTime.UtcNow
            };

            _db.Results.Add(result);
            await _db.SaveChangesAsync();

            return new ResultDto(userId, user!.Name, dto.TestId, test!.Name,
                score, testQuestions.Count, result.SubmittedAt);
        }

        /// <summary>Get the result for a user's test</summary>
        public async Task<ResultDto?> GetResultAsync(int userId, int testId)
        {
            return await _db.Results
                .Include(r => r.User)
                .Include(r => r.Test)
                .Where(r => r.UserId == userId && r.TestId == testId)
                .Select(r => new ResultDto(
                    r.UserId, r.User.Name, r.TestId, r.Test.Name,
                    r.Score, r.TotalQuestions, r.SubmittedAt))
                .FirstOrDefaultAsync();
        }
    }
}
