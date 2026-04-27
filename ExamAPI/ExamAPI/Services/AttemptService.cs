using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Services
{
    public class AttemptService
    {
        private readonly AppDbContext _db;

        private static bool IsClosed(Test test) => test.ClosingAt.HasValue && test.ClosingAt.Value <= DateTime.UtcNow;

        public AttemptService(AppDbContext db) => _db = db;

        private async Task<int?> GetUserClassIdAsync(int userId)
        {
            return await _db.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.ClassId)
                .FirstOrDefaultAsync();
        }

        private async Task<int?> GetDefaultClassIdAsync(int adminId)
        {
            return await _db.Classes
                .AsNoTracking()
                .Where(c => c.AdminId == adminId && c.Name == ClassService.DefaultClassName)
                .Select(c => (int?)c.Id)
                .FirstOrDefaultAsync();
        }

        private async Task EnsureUserCanAccessTestAsync(int userId, int adminId, Test test)
        {
            if (test.AdminId != adminId)
                throw new UnauthorizedAccessException("Test does not belong to user's organization.");

            if (test.IsGlobal) return;

            var defaultClassId = await GetDefaultClassIdAsync(adminId);
            if (defaultClassId.HasValue && test.ClassId == defaultClassId) return;

            var classId = await GetUserClassIdAsync(userId);
            if (!classId.HasValue)
                throw new UnauthorizedAccessException("User is not assigned to a class.");

            if (test.ClassId != classId)
                throw new UnauthorizedAccessException("Test is not available for user's class.");
        }

        public async Task<TestAttempt> StartOrResumeAttemptAsync(int userId, int adminId, int testId)
        {
            // Block if already submitted (existing system invariant: one Result per user per test)
            if (await _db.Results.AnyAsync(r => r.UserId == userId && r.TestId == testId))
                throw new InvalidOperationException("Test already submitted.");

            var test = await _db.Tests.FirstOrDefaultAsync(t => t.Id == testId && !t.IsDeleted && t.AdminId == adminId);
            if (test == null) throw new KeyNotFoundException("Test not found.");
            if (!test.IsActive) throw new InvalidOperationException("Test is not active.");
            if (IsClosed(test)) throw new InvalidOperationException("Test is closed.");

            await EnsureUserCanAccessTestAsync(userId, adminId, test);

            var existing = await _db.TestAttempts
                .OrderByDescending(a => a.LastSavedTime)
                .FirstOrDefaultAsync(a => a.UserId == userId && a.TestId == testId && !a.IsSubmitted);

            if (existing != null) return existing;

            var attempt = new TestAttempt
            {
                UserId = userId,
                TestId = testId,
                StartTime = DateTime.UtcNow,
                LastSavedTime = DateTime.UtcNow,
                Status = "InProgress",
                IsSubmitted = false,
                LastQuestionIndex = null
            };

            _db.TestAttempts.Add(attempt);
            await _db.SaveChangesAsync();
            return attempt;
        }

        public async Task<AttemptDto?> GetAttemptAsync(int userId, int adminId, int testId)
        {
            var attempt = await _db.TestAttempts
                .AsNoTracking()
                .OrderByDescending(a => a.LastSavedTime)
                .FirstOrDefaultAsync(a => a.UserId == userId && a.TestId == testId && !a.IsSubmitted);

            if (attempt == null) return null;

            var test = await _db.Tests
                .Include(t => t.TestQuestions)
                    .ThenInclude(tq => tq.Question)
                .Include(t => t.TestInstructions)
                    .ThenInclude(ti => ti.Instruction)
                .FirstOrDefaultAsync(t => t.Id == testId && !t.IsDeleted && t.AdminId == adminId);

            if (test == null) return null;
            if (IsClosed(test)) return null;

            await EnsureUserCanAccessTestAsync(userId, adminId, test);

            var answers = await _db.StudentAnswers
                .AsNoTracking()
                .Where(a => a.AttemptId == attempt.Id)
                .ToDictionaryAsync(a => a.QuestionId, a => a.SelectedOption);

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

            var instructions = test.TestInstructions
                .OrderBy(ti => ti.OrderIndex)
                .Select(ti => new TestInstructionDto(ti.InstructionId, ti.Instruction.Text, ti.OrderIndex))
                .ToList();

            var dto = new AttemptDto(
                attempt.Id,
                test.Id,
                test.Name,
                test.Duration,
                questions,
                answers,
                attempt.LastQuestionIndex,
                attempt.LastSavedTime,
                attempt.Status,
                test.TestImageUrl,
                test.ClosingAt,
                instructions
            );

            return dto;
        }

        public async Task SaveAnswerAsync(int userId, int adminId, int attemptId, SaveAttemptAnswerDto dto)
        {
            var attempt = await _db.TestAttempts
                .FirstOrDefaultAsync(a => a.Id == attemptId);

            if (attempt == null) throw new KeyNotFoundException("Attempt not found.");
            if (attempt.UserId != userId) throw new UnauthorizedAccessException("Attempt does not belong to user.");
            if (attempt.IsSubmitted) throw new InvalidOperationException("Attempt is not editable.");

            var test = await _db.Tests.AsNoTracking().FirstOrDefaultAsync(t => t.Id == attempt.TestId && !t.IsDeleted);
            if (test == null) throw new KeyNotFoundException("Test not found.");
            if (IsClosed(test)) throw new InvalidOperationException("Test is closed.");
            await EnsureUserCanAccessTestAsync(userId, adminId, test);

            // Block edits if a Result already exists (extra safety)
            if (await _db.Results.AnyAsync(r => r.UserId == userId && r.TestId == attempt.TestId))
                throw new InvalidOperationException("Test already submitted.");

            var existing = await _db.StudentAnswers
                .FirstOrDefaultAsync(a => a.AttemptId == attemptId && a.QuestionId == dto.QuestionId);

            var selected = dto.SelectedOption;
            var isAnswered = selected is >= 1 and <= 4;

            if (existing != null)
            {
                existing.SelectedOption = selected;
                existing.IsAnswered = isAnswered;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.StudentAnswers.Add(new StudentAnswer
                {
                    AttemptId = attemptId,
                    QuestionId = dto.QuestionId,
                    SelectedOption = selected,
                    IsAnswered = isAnswered,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            attempt.LastSavedTime = DateTime.UtcNow;
            attempt.LastQuestionIndex = dto.LastQuestionIndex;

            await _db.SaveChangesAsync();
        }

        public async Task<ResultDto> SubmitAttemptAsync(int userId, int adminId, int attemptId)
        {
            var attempt = await _db.TestAttempts
                .FirstOrDefaultAsync(a => a.Id == attemptId);

            if (attempt == null) throw new KeyNotFoundException("Attempt not found.");
            if (attempt.UserId != userId) throw new UnauthorizedAccessException("Attempt does not belong to user.");
            if (attempt.IsSubmitted) throw new InvalidOperationException("Attempt is already submitted.");

            var testForOrg = await _db.Tests.AsNoTracking().FirstOrDefaultAsync(t => t.Id == attempt.TestId && !t.IsDeleted);
            if (testForOrg == null) throw new KeyNotFoundException("Test not found.");
            if (IsClosed(testForOrg)) throw new InvalidOperationException("Test is closed.");
            await EnsureUserCanAccessTestAsync(userId, adminId, testForOrg);

            var existingResult = await _db.Results
                .Include(r => r.User)
                .Include(r => r.Test)
                .FirstOrDefaultAsync(r => r.UserId == userId && r.TestId == attempt.TestId);

            if (existingResult != null)
                return new ResultDto(existingResult.UserId, existingResult.User.Name, existingResult.TestId,
                    existingResult.Test.Name, existingResult.Score, existingResult.TotalQuestions, existingResult.SubmittedAt);

            var testQuestions = await _db.TestQuestions
                .Include(tq => tq.Question)
                .Where(tq => tq.TestId == attempt.TestId)
                .ToListAsync();

            var answers = await _db.StudentAnswers
                .Where(a => a.AttemptId == attemptId)
                .ToDictionaryAsync(a => a.QuestionId, a => a.SelectedOption);

            int score = testQuestions.Count(tq =>
                answers.TryGetValue(tq.QuestionId, out var selected) &&
                selected == tq.Question.CorrectOption);

            var test = await _db.Tests.FindAsync(attempt.TestId);
            var user = await _db.Users.FindAsync(userId);

            var result = new Result
            {
                UserId = userId,
                TestId = attempt.TestId,
                Score = score,
                TotalQuestions = testQuestions.Count,
                SubmittedAt = DateTime.UtcNow,
                IsPublished = false,
                PublishedAt = null
            };

            _db.Results.Add(result);

            attempt.Status = "Completed";
            attempt.IsSubmitted = true;
            attempt.LastSavedTime = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return new ResultDto(userId, user!.Name, attempt.TestId, test!.Name,
                score, testQuestions.Count, result.SubmittedAt);
        }
    }
}
