using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Services
{
    public class UserService
    {
        private readonly AppDbContext _db;

        private static bool IsClosed(Test test) => test.ClosingAt.HasValue && test.ClosingAt.Value <= DateTime.UtcNow;

        public UserService(AppDbContext db) => _db = db;

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

        /// <summary>Gets the signed-in user's complete profile information.</summary>
        public async Task<UserProfileDto?> GetProfileAsync(int userId, int adminId)
        {
            var user = await _db.Users
                .AsNoTracking()
                .Include(u => u.Class)
                .Include(u => u.Admin)
                .FirstOrDefaultAsync(u => u.Id == userId && u.Role == "User" && u.AdminId == adminId);

            if (user == null)
                return null;

            return new UserProfileDto(
                user.Id,
                user.Name,
                user.Username,
                user.Email,
                user.MobileNumber,
                user.RollNumber,
                user.Pincode,
                user.Address,
                user.Role,
                user.IsActive,
                user.IsEmailVerified,
                user.PreferredLanguage,
                user.CreatedAt,
                user.ClassId,
                user.Class?.Name,
                user.AdminId,
                user.Admin?.Name
            );
        }
        
        /// <summary>Lists all tests available in the system with user's specific status (completed, score, etc.)</summary>
        public async Task<List<UserTestStatusDto>> GetAvailableTestsAsync(int userId, int adminId)
        {
            var classId = await GetUserClassIdAsync(userId);
            var defaultClassId = await GetDefaultClassIdAsync(adminId);
            var tests = await _db.Tests
                .Where(t => t.IsActive && !t.IsDeleted && t.AdminId == adminId &&
                    (!t.ClosingAt.HasValue || t.ClosingAt > DateTime.UtcNow) &&
                    (t.IsGlobal || (defaultClassId.HasValue && t.ClassId == defaultClassId) || (classId.HasValue && t.ClassId == classId)))
                .Include(t => t.TestQuestions)
                .ToListAsync();

            var testIds = tests.Select(t => t.Id).ToList();

            var recentAttempts = await _db.TestAttempts
                .AsNoTracking()
                .Where(a => a.UserId == userId && testIds.Contains(a.TestId))
                .Select(a => new { a.Id, a.TestId, a.LastSavedTime, a.Status })
                .OrderByDescending(a => a.LastSavedTime)
                .ToListAsync();

            var latestAttemptByTestId = recentAttempts
                .GroupBy(a => a.TestId)
                .ToDictionary(g => g.Key, g => g.First());

            var latestAttemptIds = latestAttemptByTestId.Values.Select(a => a.Id).ToList();

            var answeredCountsByAttemptId = latestAttemptIds.Count == 0
                ? new Dictionary<int, int>()
                : await _db.StudentAnswers
                    .AsNoTracking()
                    .Where(a => latestAttemptIds.Contains(a.AttemptId) && (a.IsAnswered || (a.SelectedOption >= 1 && a.SelectedOption <= 4)))
                    .GroupBy(a => a.AttemptId)
                    .Select(g => new { AttemptId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.AttemptId, x => x.Count);

            var legacyAnsweredCounts = await _db.UserAnswers
                .AsNoTracking()
                .Where(a => a.UserId == userId && testIds.Contains(a.TestId) && a.SelectedOption >= 1 && a.SelectedOption <= 4)
                .GroupBy(a => a.TestId)
                .Select(g => new { TestId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TestId, x => x.Count);

            var publishedResults = await _db.Results
                .AsNoTracking()
                .Where(r => r.UserId == userId && r.IsPublished)
                .ToDictionaryAsync(r => r.TestId);

            var pendingResults = await _db.Results
                .AsNoTracking()
                .Where(r => r.UserId == userId && !r.IsPublished)
                .ToDictionaryAsync(r => r.TestId);

            return tests.Select(t =>
            {
                var isPublished = publishedResults.TryGetValue(t.Id, out var publishedResult);
                var isPending = pendingResults.ContainsKey(t.Id);
                var isSubmitted = isPublished || isPending;
                var hasAttempt = latestAttemptByTestId.TryGetValue(t.Id, out var latestAttempt);
                var attemptAnsweredCount = hasAttempt && latestAttempt != null && answeredCountsByAttemptId.TryGetValue(latestAttempt.Id, out var count)
                    ? count
                    : 0;
                var legacyAnsweredCount = legacyAnsweredCounts.TryGetValue(t.Id, out var legacyCount) ? legacyCount : 0;
                var answeredCount = Math.Max(attemptAnsweredCount, legacyAnsweredCount);
                var hasInProgressAttempt = !isSubmitted && hasAttempt && string.Equals(latestAttempt?.Status, "InProgress", StringComparison.OrdinalIgnoreCase);

                return new UserTestStatusDto(
                    t.Id,
                    t.Name,
                    t.Description,
                    t.Duration,
                    t.TestQuestions.Count,
                    isSubmitted,
                    isPublished && publishedResult != null ? (int?)publishedResult.Score : null,
                    isSubmitted,
                    isPublished,
                    hasInProgressAttempt,
                    answeredCount,
                    t.TestImageUrl,
                    t.ClosingAt
                );
            }).ToList();
        }

        /// <summary>Get a test with all its questions (excluding correct answers) and any saved answers</summary>
        public async Task<TestDto?> GetTestAsync(int testId, int userId, int adminId)
        {
            var test = await _db.Tests
                .Include(t => t.TestQuestions)
                    .ThenInclude(tq => tq.Question)
                .Include(t => t.TestInstructions)
                    .ThenInclude(ti => ti.Instruction)
                .FirstOrDefaultAsync(t => t.Id == testId && !t.IsDeleted && t.AdminId == adminId);

            if (test == null) return null;
            if (IsClosed(test)) return null;

            await EnsureUserCanAccessTestAsync(userId, adminId, test);

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

            var instructions = test.TestInstructions
                .OrderBy(ti => ti.OrderIndex)
                .Select(ti => new TestInstructionDto(ti.InstructionId, ti.Instruction.Text, ti.OrderIndex))
                .ToList();

            return new TestDto(test.Id, test.Name, test.Description, test.Duration, questions, savedAnswers, test.TestImageUrl, test.ClosingAt, instructions);
        }

        /// <summary>Auto-save a single answer (upsert pattern)</summary>
        public async Task SaveAnswerAsync(int userId, int adminId, SubmitAnswerDto dto)
        {
            var test = await _db.Tests.AsNoTracking().FirstOrDefaultAsync(t => t.Id == dto.TestId && !t.IsDeleted);
            if (test == null) throw new KeyNotFoundException("Test not found.");
            if (IsClosed(test)) throw new InvalidOperationException("Test is closed.");
            await EnsureUserCanAccessTestAsync(userId, adminId, test);

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
        public async Task<ResultDto> SubmitTestAsync(int userId, int adminId, SubmitTestDto dto)
        {
            var testForOrg = await _db.Tests.AsNoTracking().FirstOrDefaultAsync(t => t.Id == dto.TestId && !t.IsDeleted);
            if (testForOrg == null) throw new KeyNotFoundException("Test not found.");
            if (IsClosed(testForOrg)) throw new InvalidOperationException("Test is closed.");
            await EnsureUserCanAccessTestAsync(userId, adminId, testForOrg);

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
                SubmittedAt = DateTime.UtcNow,
                IsPublished = false,
                PublishedAt = null
            };

            _db.Results.Add(result);
            await _db.SaveChangesAsync();

            return new ResultDto(userId, user!.Name, dto.TestId, test!.Name,
                score, testQuestions.Count, result.SubmittedAt);
        }

        /// <summary>Get the result for a user's test</summary>
        public async Task<ResultDto?> GetResultAsync(int userId, int adminId, int testId)
        {
            var testForOrg = await _db.Tests.AsNoTracking().FirstOrDefaultAsync(t => t.Id == testId && !t.IsDeleted);
            if (testForOrg == null) return null;
            await EnsureUserCanAccessTestAsync(userId, adminId, testForOrg);

            var unpublishedExists = await _db.Results
                .AsNoTracking()
                .AnyAsync(r => r.UserId == userId && r.TestId == testId && !r.IsPublished);

            if (unpublishedExists)
                throw new InvalidOperationException("Result is pending admin release.");

            return await _db.Results
                .Include(r => r.User)
                .Include(r => r.Test)
                .Where(r => r.UserId == userId && r.TestId == testId && r.IsPublished)
                .Select(r => new ResultDto(
                    r.UserId, r.User.Name, r.TestId, r.Test.Name,
                    r.Score, r.TotalQuestions, r.SubmittedAt,
                    r.IsPublished, r.PublishedAt))
                .FirstOrDefaultAsync();
        }

        /// <summary>Update user's preferred language</summary>
        public async Task UpdatePreferencesAsync(int userId, UpdatePreferencesDto dto)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) throw new KeyNotFoundException("User not found.");

            if (!new[] { "en", "hi", "gu" }.Contains(dto.PreferredLanguage))
                throw new InvalidOperationException("Invalid language. Allowed: en, hi, gu");

            user.PreferredLanguage = dto.PreferredLanguage;
            await _db.SaveChangesAsync();
        }
    }
}
