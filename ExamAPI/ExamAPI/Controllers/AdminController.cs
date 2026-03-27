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

        // ── Tests ──────────────────────────────────────────────────────────────

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
