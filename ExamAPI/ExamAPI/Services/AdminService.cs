using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Linq;

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

        public async Task<List<AdminTestDto>> GetTestsAsync()
        {
            return await _db.Tests
                .Select(t => new AdminTestDto(t.Id, t.Name, t.Duration, t.TestQuestions.Count))
                .ToListAsync();
        }

        public async Task<List<int>> GetTestQuestionIdsAsync(int testId)
        {
            return await _db.TestQuestions
                .Where(tq => tq.TestId == testId)
                .OrderBy(tq => tq.OrderIndex)
                .Select(tq => tq.QuestionId)
                .ToListAsync();
        }

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

        // ── Excel/CSV Import ──────────────────────────────────────────────────
        public async Task<ImportSummaryDto> ImportQuestionsAsync(IFormFile file)
        {
            var summary = new ImportSummaryDto();
            var questionsToInsert = new List<Question>();
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (extension == ".xlsx")
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                using var package = new ExcelPackage(stream);
                var worksheet = package.Workbook.Worksheets[0];
                int rowCount = worksheet.Dimension?.Rows ?? 0;
                summary.TotalRows = Math.Max(0, rowCount - 1);

                for (int row = 2; row <= rowCount; row++)
                {
                    try {
                        string q = worksheet.Cells[row, 1].Text?.Trim() ?? "";
                        if (string.IsNullOrEmpty(q)) continue;
                        questionsToInsert.Add(MapToQuestion(
                            q,
                            worksheet.Cells[row, 2].Text,
                            worksheet.Cells[row, 3].Text,
                            worksheet.Cells[row, 4].Text,
                            worksheet.Cells[row, 5].Text,
                            worksheet.Cells[row, 6].Text,
                            row, summary));
                    } catch (Exception ex) { summary.Errors.Add($"Row {row}: {ex.Message}"); summary.FailedCount++; }
                }
            }
            else if (extension == ".csv")
            {
                using var reader = new StreamReader(file.OpenReadStream());
                var content = await reader.ReadToEndAsync();
                var lines = content.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
                summary.TotalRows = Math.Max(0, lines.Length - 1);

                for (int i = 1; i < lines.Length; i++)
                {
                    if (string.IsNullOrWhiteSpace(lines[i])) continue;
                    try {
                        var parts = lines[i].Split(','); // Simple split
                        if (parts.Length < 6) { summary.Errors.Add($"Row {i+1}: Missing columns."); summary.FailedCount++; continue; }
                        questionsToInsert.Add(MapToQuestion(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], i + 1, summary));
                    } catch (Exception ex) { summary.Errors.Add($"Row {i+1}: {ex.Message}"); summary.FailedCount++; }
                }
            }

            questionsToInsert = questionsToInsert.Where(q => q != null).ToList();
            if (questionsToInsert.Any())
            {
                await _db.Questions.AddRangeAsync(questionsToInsert);
                await _db.SaveChangesAsync();
            }
            return summary;
        }

        private Question MapToQuestion(string q, string a, string b, string c, string d, string ans, int row, ImportSummaryDto summary)
        {
            q = q?.Trim(); a = a?.Trim(); b = b?.Trim(); c = c?.Trim(); d = d?.Trim(); ans = ans?.Trim()?.ToUpper();
            if (string.IsNullOrEmpty(q) || string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b) || string.IsNullOrEmpty(c) || string.IsNullOrEmpty(d))
            {
                summary.Errors.Add($"Row {row}: Missing fields.");
                summary.FailedCount++;
                return null;
            }

            int correctOpt = ans switch { "A" => 1, "B" => 2, "C" => 3, "D" => 4, _ => 0 };
            if (correctOpt == 0)
            {
                summary.Errors.Add($"Row {row}: Invalid CorrectAnswer '{ans}'.");
                summary.FailedCount++;
                return null;
            }

            summary.SuccessCount++;
            return new Question { Question_EN = q, Option1_EN = a, Option2_EN = b, Option3_EN = c, Option4_EN = d, CorrectOption = correctOpt };
        }
    }
}
