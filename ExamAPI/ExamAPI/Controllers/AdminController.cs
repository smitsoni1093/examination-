using ExamAPI.DTOs;
using ExamAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;

        public AdminController(AdminService adminService) => _adminService = adminService;

        // ── Users ──────────────────────────────────────────────────────────────

        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            try
            {
                var user = await _adminService.CreateUserAsync(dto);
                return Ok(new { user.Id, user.Name, user.Username, user.Role });
            }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _adminService.GetUsersAsync();
            return Ok(users.Select(u => new { u.Id, u.Name, u.Username }));
        }

        // ── Questions ──────────────────────────────────────────────────────────

        [HttpPost("create-question")]
        public async Task<IActionResult> CreateQuestion([FromBody] CreateQuestionDto dto)
        {
            try
            {
                var q = await _adminService.CreateQuestionAsync(dto);
                return Ok(new { q.Id, q.Question_EN, q.CorrectOption });
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("questions")]
        public async Task<IActionResult> GetQuestions()
        {
            var questions = await _adminService.GetQuestionsAsync();
            return Ok(questions.Select(q => new { q.Id, q.Question_EN, q.CorrectOption }));
        }

        [HttpPost("questions/import")]
        public async Task<IActionResult> ImportQuestions(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });
            
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".xlsx" && extension != ".csv") return BadRequest(new { message = "Only .xlsx and .csv files are supported." });

            if (file.Length > 5 * 1024 * 1024) return BadRequest(new { message = "File size exceeds 5MB limit." });

            var summary = await _adminService.ImportQuestionsAsync(file);
            return Ok(summary);
        }

        // ── Tests ──────────────────────────────────────────────────────────────

        [HttpGet("tests")]
        public async Task<IActionResult> GetTests()
        {
            var tests = await _adminService.GetTestsAsync();
            return Ok(tests);
        }

        [HttpGet("test-questions/{testId}")]
        public async Task<IActionResult> GetTestQuestions(int testId)
        {
            try
            {
                var questionIds = await _adminService.GetTestQuestionIdsAsync(testId);
                return Ok(questionIds);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPost("create-test")]
        public async Task<IActionResult> CreateTest([FromBody] CreateTestDto dto)
        {
            var test = await _adminService.CreateTestAsync(dto);
            return Ok(test);
        }

        [HttpPost("assign-questions-to-test")]
        public async Task<IActionResult> AssignQuestions([FromBody] AssignQuestionsDto dto)
        {
            try
            {
                await _adminService.AssignQuestionsAsync(dto);
                return Ok(new { message = $"{dto.QuestionIds.Count} questions assigned to test {dto.TestId}." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        // ── Results ────────────────────────────────────────────────────────────

        [HttpGet("results")]
        public async Task<IActionResult> GetResults()
        {
            var results = await _adminService.GetAllResultsAsync();
            return Ok(results);
        }
    }
}
