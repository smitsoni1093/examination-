using ExamAPI.Data;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Services
{
    public class ExamAutoSubmitService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ExamAutoSubmitService> _logger;

        public ExamAutoSubmitService(IServiceScopeFactory scopeFactory, ILogger<ExamAutoSubmitService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await SubmitClosedAttemptsAsync(stoppingToken);

            using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await SubmitClosedAttemptsAsync(stoppingToken);
            }
        }

        private async Task SubmitClosedAttemptsAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var now = DateTime.UtcNow;

                var attempts = await db.TestAttempts
                    .Include(a => a.Test)
                    .Where(a =>
                        !a.IsSubmitted &&
                        a.Test.ClosingAt.HasValue &&
                        a.Test.ClosingAt.Value <= now &&
                        !a.Test.IsDeleted)
                    .OrderBy(a => a.Test.ClosingAt)
                    .Take(100)
                    .ToListAsync(cancellationToken);

                foreach (var attempt in attempts)
                {
                    await SubmitAttemptAsync(db, attempt, now, cancellationToken);
                }

                if (attempts.Count > 0)
                    await db.SaveChangesAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                // Normal shutdown.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to auto-submit closed exam attempts.");
            }
        }

        private static async Task SubmitAttemptAsync(
            AppDbContext db,
            TestAttempt attempt,
            DateTime submittedAt,
            CancellationToken cancellationToken)
        {
            var testQuestions = await db.TestQuestions
                .Include(tq => tq.Question)
                .Where(tq => tq.TestId == attempt.TestId)
                .ToListAsync(cancellationToken);

            var answers = await db.StudentAnswers
                .Where(a => a.AttemptId == attempt.Id)
                .ToDictionaryAsync(a => a.QuestionId, a => a.SelectedOption, cancellationToken);

            var score = testQuestions.Count(tq =>
                answers.TryGetValue(tq.QuestionId, out var selected) &&
                selected == tq.Question.CorrectOption);

            var result = await db.Results
                .FirstOrDefaultAsync(r => r.UserId == attempt.UserId && r.TestId == attempt.TestId, cancellationToken);

            if (result == null)
            {
                db.Results.Add(new Result
                {
                    UserId = attempt.UserId,
                    TestId = attempt.TestId,
                    Score = score,
                    TotalQuestions = testQuestions.Count,
                    SubmittedAt = submittedAt,
                    IsPublished = false,
                    ShowDetailedAnswers = false,
                    PublishedAt = null
                });
            }
            else
            {
                result.Score = score;
                result.TotalQuestions = testQuestions.Count;
                result.SubmittedAt = submittedAt;
                result.IsPublished = false;
                result.ShowDetailedAnswers = false;
                result.PublishedAt = null;
            }

            attempt.Status = "Completed";
            attempt.IsSubmitted = true;
            attempt.IsReleased = false;
            attempt.LastSavedTime = submittedAt;
        }
    }
}
