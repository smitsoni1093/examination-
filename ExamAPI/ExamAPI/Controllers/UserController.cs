using System.Security.Claims;
using ExamAPI.DTOs;
using ExamAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize(Roles = "User")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService) => _userService = userService;

        /// <summary>Helper: extracts UserId from the JWT claims</summary>
        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>Get list of all tests and their current status for the user</summary>
        [HttpGet("available-tests")]
        public async Task<IActionResult> GetAvailableTests()
        {
            return Ok(await _userService.GetAvailableTestsAsync(GetUserId()));
        }

        /// <summary>Get test with questions (no correct answers exposed) and saved answers for resume support</summary>
        [HttpGet("test/{id}")]
        public async Task<IActionResult> GetTest(int id)
        {
            var testDto = await _userService.GetTestAsync(id, GetUserId());
            if (testDto == null) return NotFound(new { message = "Test not found." });
            return Ok(testDto);
        }

        /// <summary>Auto-save a single answer (upsert)</summary>
        [HttpPost("submit-answer")]
        public async Task<IActionResult> SubmitAnswer([FromBody] SubmitAnswerDto dto)
        {
            try
            {
                await _userService.SaveAnswerAsync(GetUserId(), dto);
                return Ok(new { message = "Answer saved." });
            }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        /// <summary>Final test submission — calculates score and stores result</summary>
        [HttpPost("submit-test")]
        public async Task<IActionResult> SubmitTest([FromBody] SubmitTestDto dto)
        {
            var result = await _userService.SubmitTestAsync(GetUserId(), dto);
            return Ok(result);
        }

        /// <summary>Get result for a specific test</summary>
        [HttpGet("result")]
        public async Task<IActionResult> GetResult([FromQuery] int testId)
        {
            var result = await _userService.GetResultAsync(GetUserId(), testId);
            if (result == null) return NotFound(new { message = "No result found for this test." });
            return Ok(result);
        }
    }
}
