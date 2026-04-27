using ExamAPI.DTOs;
using ExamAPI.Models;
using ExamAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using System.Security.Claims;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;

        public AdminController(AdminService adminService) => _adminService = adminService;

        private int GetAdminId()
        {
            var adminIdClaim = User.FindFirstValue("AdminId");
            if (!string.IsNullOrWhiteSpace(adminIdClaim) && int.TryParse(adminIdClaim, out var adminId))
                return adminId;

            // Backward compatibility: older tokens may not contain AdminId claim.
            // Since this controller is Admin-only, use the logged-in user's id as adminId.
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out var userId))
                return userId;

            throw new UnauthorizedAccessException("AdminId claim missing.");
        }

        // ── Users ──────────────────────────────────────────────────────────────

        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody] CreateInvitedUserDto dto)
        {
            var adminId = GetAdminId();
            var result = await _adminService.CreateUserForOtpAsync(adminId, dto);
            return Ok(result);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var adminId = GetAdminId();
            var users = await _adminService.GetUsersAsync(adminId);
            return Ok(users.Select(u => new { u.Id, u.Name, u.Username, u.Email, u.MobileNumber, u.RollNumber, u.Pincode, u.Address, u.ClassId }));
        }

        [HttpGet("users/export")]
        public async Task<IActionResult> ExportUsersExcel()
        {
            var adminId = GetAdminId();
            var users = await _adminService.GetUsersAsync(adminId);

            using var package = new ExcelPackage();
            var sheet = package.Workbook.Worksheets.Add("Users");

            var headers = new[]
            {
                "No.",
                "Roll Number",
                "Full Name",
                "Username",
                "Email",
                "Mobile Number",
                "Pincode",
                "Address",
                "Class Id"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                sheet.Cells[1, i + 1].Value = headers[i];
            }

            sheet.Cells[1, 1, 1, headers.Length].Style.Font.Bold = true;

            var orderedUsers = users.OrderByDescending(u => u.Id).ToList();
            for (int i = 0; i < orderedUsers.Count; i++)
            {
                var user = orderedUsers[i];
                var row = i + 2;

                sheet.Cells[row, 1].Value = i + 1;
                sheet.Cells[row, 2].Value = user.RollNumber;
                sheet.Cells[row, 3].Value = user.Name;
                sheet.Cells[row, 4].Value = user.Username;
                sheet.Cells[row, 5].Value = user.Email;
                sheet.Cells[row, 6].Value = user.MobileNumber;
                sheet.Cells[row, 7].Value = user.Pincode;
                sheet.Cells[row, 8].Value = user.Address;
                sheet.Cells[row, 9].Value = user.ClassId;
            }

            if (orderedUsers.Count > 0)
            {
                sheet.Cells[1, 1, orderedUsers.Count + 1, headers.Length].AutoFitColumns();
            }

            var fileBytes = package.GetAsByteArray();
            var fileName = $"users-{DateTime.UtcNow:yyyyMMdd-HHmmss}.xlsx";
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("users/paged")]
        public async Task<IActionResult> GetUsersPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var adminId = GetAdminId();
            var safePage = Math.Max(page, 1);
            var safePageSize = Math.Clamp(pageSize, 1, 100);

            var (items, totalCount) = await _adminService.GetUsersPageAsync(adminId, safePage, safePageSize);
            var totalPages = (int)Math.Ceiling(totalCount / (double)safePageSize);

            return Ok(new
            {
                items = items.Select(u => new { u.Id, u.Name, u.Username, u.Email, u.MobileNumber, u.RollNumber, u.Pincode, u.Address, u.ClassId }),
                totalCount,
                page = safePage,
                pageSize = safePageSize,
                totalPages
            });
        }

        [HttpPut("users/{id:int}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateInvitedUserDto dto)
        {
            var adminId = GetAdminId();
            var user = await _adminService.UpdateUserForOtpAsync(adminId, id, dto);
            return Ok(new { user.Id, user.Name, user.Username, user.Email, user.MobileNumber, user.RollNumber, user.Pincode, user.Address, user.ClassId });
        }

        [HttpDelete("users/{id:int}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var adminId = GetAdminId();
            await _adminService.DeleteUserAsync(adminId, id);
            return Ok(new { message = "User deleted successfully." });
        }

        [HttpPost("users/import")]
        public IActionResult ImportUsers()
        {
            return BadRequest(new
            {
                message = "Manual column mapping is required. Use /api/admin/users/import/init, /preview, and /confirm."
            });
        }

        [HttpPost("users/import/init")]
        public async Task<IActionResult> InitializeUserImport(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".xlsx" && extension != ".csv") return BadRequest(new { message = "Only .xlsx and .csv files are supported." });

            if (file.Length > 5 * 1024 * 1024) return BadRequest(new { message = "File size exceeds 5MB limit." });

            var adminId = GetAdminId();
            var session = await _adminService.InitializeUserImportAsync(adminId, file);
            return Ok(session);
        }

        [HttpPost("users/import/preview")]
        public async Task<IActionResult> PreviewUserImport([FromBody] UserImportPreviewRequestDto request)
        {
            var adminId = GetAdminId();
            var preview = await _adminService.PreviewUserImportAsync(adminId, request);
            return Ok(preview);
        }

        [HttpPost("users/import/confirm")]
        public async Task<IActionResult> ConfirmUserImport([FromBody] UserImportConfirmRequestDto request)
        {
            var adminId = GetAdminId();
            var summary = await _adminService.ConfirmUserImportAsync(adminId, request);
            return Ok(summary);
        }

        // ── Questions ──────────────────────────────────────────────────────────

        [HttpPost("create-question")]
        public async Task<IActionResult> CreateQuestion([FromBody] CreateQuestionDto dto)
        {
            try
            {
                var adminId = GetAdminId();
                var q = await _adminService.CreateQuestionAsync(adminId, dto);
                return Ok(new { q.Id, q.Question_EN, q.CorrectOption });
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("questions")]
        public async Task<IActionResult> GetQuestions([FromQuery] string? source, [FromQuery] string? search, [FromQuery] int? skip, [FromQuery] int? take)
        {
            var adminId = GetAdminId();
            var questions = await _adminService.GetQuestionsAsync(adminId, source, search, skip, take);
            return Ok(questions);
        }

        [HttpGet("questions/paged")]
        public async Task<IActionResult> GetQuestionsPaged([FromQuery] string? source, [FromQuery] string? search, [FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            var adminId = GetAdminId();
            var safeSkip = Math.Max(skip, 0);
            var safeTake = Math.Clamp(take, 1, 100);
            var (items, totalCount) = await _adminService.GetQuestionsPageAsync(adminId, source, search, safeSkip, safeTake);

            return Ok(new
            {
                items,
                totalCount,
                skip = safeSkip,
                take = safeTake
            });
        }

        [HttpGet("question-sources")]
        public async Task<IActionResult> GetQuestionSources()
        {
            var adminId = GetAdminId();
            var sources = await _adminService.GetQuestionSourcesAsync(adminId);
            return Ok(sources);
        }

        [HttpGet("question-source-files")]
        public async Task<IActionResult> GetQuestionSourceFiles()
        {
            var adminId = GetAdminId();
            var sourceFiles = await _adminService.GetQuestionSourceFilesAsync(adminId);
            return Ok(sourceFiles);
        }

        [HttpPatch("question-sources/soft-delete")]
        public async Task<IActionResult> SoftDeleteQuestionSource([FromBody] SoftDeleteQuestionSourceDto dto)
        {
            var adminId = GetAdminId();
            await _adminService.SoftDeleteQuestionSourceAsync(adminId, dto.SourceFileName);
            return Ok(new { message = "Source file deleted successfully." });
        }

        [HttpPost("questions/import")]
        public IActionResult ImportQuestions()
        {
            return BadRequest(new
            {
                message = "Manual column mapping is required. Use /api/admin/questions/import/init, /preview, and /confirm."
            });
        }

        [HttpPost("questions/import/init")]
        public async Task<IActionResult> InitializeQuestionImport(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".xlsx" && extension != ".csv") return BadRequest(new { message = "Only .xlsx and .csv files are supported." });

            if (file.Length > 5 * 1024 * 1024) return BadRequest(new { message = "File size exceeds 5MB limit." });

            var adminId = GetAdminId();
            var session = await _adminService.InitializeQuestionImportAsync(adminId, file);
            return Ok(session);
        }

        [HttpPost("questions/import/preview")]
        public async Task<IActionResult> PreviewQuestionImport([FromBody] QuestionImportPreviewRequestDto request)
        {
            var adminId = GetAdminId();
            var preview = await _adminService.PreviewQuestionImportAsync(adminId, request);
            return Ok(preview);
        }

        [HttpPost("questions/import/confirm")]
        public async Task<IActionResult> ConfirmQuestionImport([FromBody] QuestionImportConfirmRequestDto request)
        {
            var adminId = GetAdminId();
            var summary = await _adminService.ConfirmQuestionImportAsync(adminId, request);
            return Ok(summary);
        }

        // ── Instructions ──────────────────────────────────────────────────────

        [HttpGet("instructions")]
        public async Task<IActionResult> GetInstructions()
        {
            var adminId = GetAdminId();
            var instructions = await _adminService.GetInstructionsAsync(adminId);
            return Ok(instructions);
        }

        [HttpPost("instructions")]
        public async Task<IActionResult> CreateInstruction([FromBody] CreateInstructionDto dto)
        {
            var adminId = GetAdminId();
            var instruction = await _adminService.CreateInstructionAsync(adminId, dto);
            return Ok(instruction);
        }

        [HttpPut("instructions/{instructionId}")]
        public async Task<IActionResult> UpdateInstruction(int instructionId, [FromBody] UpdateInstructionDto dto)
        {
            try
            {
                var adminId = GetAdminId();
                var instruction = await _adminService.UpdateInstructionAsync(adminId, instructionId, dto);
                return Ok(instruction);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("instructions/{instructionId}")]
        public async Task<IActionResult> DeleteInstruction(int instructionId)
        {
            try
            {
                var adminId = GetAdminId();
                await _adminService.DeleteInstructionAsync(adminId, instructionId);
                return Ok(new { message = "Instruction deleted successfully." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        // ── Tests ──────────────────────────────────────────────────────────────

        [HttpGet("tests")]
        public async Task<IActionResult> GetTests()
        {
            var adminId = GetAdminId();
            var tests = await _adminService.GetTestsAsync(adminId);
            return Ok(tests);
        }

        [HttpGet("test-questions/{testId}")]
        public async Task<IActionResult> GetTestQuestions(int testId)
        {
            try
            {
                var adminId = GetAdminId();
                var questionIds = await _adminService.GetTestQuestionIdsAsync(adminId, testId);
                return Ok(questionIds);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet("test-questions-details/{testId}")]
        public async Task<IActionResult> GetTestQuestionsDetails(int testId)
        {
            try
            {
                var adminId = GetAdminId();
                var questions = await _adminService.GetTestQuestionsAsync(adminId, testId);
                return Ok(questions);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPost("create-test")]
        public async Task<IActionResult> CreateTest([FromBody] CreateTestDto dto)
        {
            var adminId = GetAdminId();
            var test = await _adminService.CreateTestAsync(adminId, dto);
            return Ok(test);
        }

        [HttpPut("tests/{testId}")]
        public async Task<IActionResult> UpdateTest(int testId, [FromBody] UpdateTestDto dto)
        {
            try
            {
                var adminId = GetAdminId();
                var updated = await _adminService.UpdateTestAsync(adminId, testId, dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("assign-questions-to-test")]
        public async Task<IActionResult> AssignQuestions([FromBody] AssignQuestionsDto dto)
        {
            try
            {
                var adminId = GetAdminId();
                await _adminService.AssignQuestionsAsync(adminId, dto);
                return Ok(new { message = $"{dto.QuestionIds.Count} questions assigned to test {dto.TestId}." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("tests/{testId}")]
        public async Task<IActionResult> DeleteTest(int testId)
        {
            try
            {
                var adminId = GetAdminId();
                await _adminService.SoftDeleteTestAsync(adminId, testId);
                return Ok(new { message = "Test deleted successfully." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        // ── Results ────────────────────────────────────────────────────────────

        [HttpGet("results")]
        public async Task<IActionResult> GetResults()
        {
            try
            {
                var adminId = GetAdminId();
                var results = await _adminService.GetAllResultsAsync(adminId);
                return Ok(results);
            }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        }

        [HttpGet("results/answers")]
        public async Task<IActionResult> GetAnswerReview([FromQuery] int userId, [FromQuery] int testId)
        {
            try
            {
                var adminId = GetAdminId();
                var review = await _adminService.GetAnswerReviewAsync(adminId, userId, testId);
                return Ok(review);
            }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPost("results/release")]
        public async Task<IActionResult> ReleaseResult([FromBody] ReleaseResultDto dto)
        {
            try
            {
                var adminId = GetAdminId();
                await _adminService.ReleaseResultAsync(adminId, dto.UserId, dto.TestId);
                return Ok(new { message = "Result released successfully." });
            }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPut("questions/{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, Question question)
        {
            var adminId = GetAdminId();
            await _adminService.UpdateQuestionAsync(adminId, id, question);
            return Ok(new { message = "Question updated" });
        }

        [HttpDelete("questions/{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            try
            {
                var adminId = GetAdminId();
                await _adminService.DeleteQuestionAsync(adminId, id);
                return Ok(new { message = "Question deleted successfully." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPost("questions/delete-bulk")]
        public async Task<IActionResult> DeleteBulkQuestions([FromBody] List<int> ids)
        {
            if (ids == null || ids.Count == 0) return BadRequest(new { message = "No question IDs provided." });
            try
            {
                var adminId = GetAdminId();
                await _adminService.DeleteBulkQuestionsAsync(adminId, ids);
                return Ok(new { message = $"{ids.Count} questions deleted successfully." });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("test-questions/{testId}/{questionId}")]
        public async Task<IActionResult> RemoveQuestionFromTest(int testId, int questionId)
        {
            var adminId = GetAdminId();
            await _adminService.RemoveQuestionFromTestAsync(adminId, testId, questionId);
            return Ok(new { message = "Question removed from test." });
        }

        [HttpPatch("tests/{testId}/status")]
        public async Task<IActionResult> ToggleTestStatus(int testId, [FromBody] UpdateStatusDto dto)
        {
            var adminId = GetAdminId();
            await _adminService.UpdateTestStatusAsync(adminId, testId, dto.IsActive);
            return Ok(new { message = "Test status updated." });
        }
    }

    public record UpdateStatusDto(bool IsActive);
    public record SoftDeleteQuestionSourceDto(string SourceFileName);
}
