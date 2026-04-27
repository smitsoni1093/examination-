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

        private int GetAdminId()
        {
            var adminIdClaim = User.FindFirstValue("AdminId");
            if (string.IsNullOrWhiteSpace(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
                throw new UnauthorizedAccessException("AdminId claim missing. Please login again.");
            return adminId;
        }

        /// <summary>Get list of all tests and their current status for the user</summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var profile = await _userService.GetProfileAsync(GetUserId(), GetAdminId());
                if (profile == null) return NotFound(new { message = "User profile not found." });
                return Ok(profile);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>Get list of all tests and their current status for the user</summary>
        [HttpGet("available-tests")]
        public async Task<IActionResult> GetAvailableTests()
        {
            try
            {
                return Ok(await _userService.GetAvailableTestsAsync(GetUserId(), GetAdminId()));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>Get test with questions (no correct answers exposed) and saved answers for resume support</summary>
        [HttpGet("test/{id}")]
        public async Task<IActionResult> GetTest(int id)
        {
            TestDto? testDto;
            try
            {
                testDto = await _userService.GetTestAsync(id, GetUserId(), GetAdminId());
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            if (testDto == null) return NotFound(new { message = "Test not found." });
            return Ok(testDto);
        }

        /// <summary>Auto-save a single answer (upsert)</summary>
        [HttpPost("submit-answer")]
        public async Task<IActionResult> SubmitAnswer([FromBody] SubmitAnswerDto dto)
        {
            try
            {
                await _userService.SaveAnswerAsync(GetUserId(), GetAdminId(), dto);
                return Ok(new { message = "Answer saved." });
            }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        /// <summary>Final test submission — calculates score and stores result</summary>
        [HttpPost("submit-test")]
        public async Task<IActionResult> SubmitTest([FromBody] SubmitTestDto dto)
        {
            try
            {
                await _userService.SubmitTestAsync(GetUserId(), GetAdminId(), dto);
                return Ok(new
                {
                    message = "Test submitted successfully. Result will be available after admin release.",
                    isResultPublished = false
                });
            }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        /// <summary>Get result for a specific test</summary>
        [HttpGet("result")]
        public async Task<IActionResult> GetResult([FromQuery] int testId)
        {
            try
            {
                var result = await _userService.GetResultAsync(GetUserId(), GetAdminId(), testId);
                if (result == null) return NotFound(new { message = "No result found for this test." });
                return Ok(result);
            }
            catch (InvalidOperationException ex) { return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        }

        /// <summary>Update user language preference</summary>
        [HttpPatch("preferences")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesDto dto)
        {
            try
            {
                await _userService.UpdatePreferencesAsync(GetUserId(), dto);
                return Ok(new { success = true, messageKey = "PREFERENCES_UPDATED_SUCCESS" });
            }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }
    }
}
