using System.Security.Claims;
using ExamAPI.DTOs;
using ExamAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/tests")]
    [Authorize(Roles = "User")]
    public class TestsController : ControllerBase
    {
        private readonly AttemptService _attemptService;

        public TestsController(AttemptService attemptService) => _attemptService = attemptService;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private int GetAdminId()
        {
            var adminIdClaim = User.FindFirstValue("AdminId");
            if (string.IsNullOrWhiteSpace(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
                throw new UnauthorizedAccessException("AdminId claim missing. Please login again.");
            return adminId;
        }

        [HttpPost("{testId}/start")]
        public async Task<IActionResult> StartTest(int testId)
        {
            try
            {
                var attempt = await _attemptService.StartOrResumeAttemptAsync(GetUserId(), GetAdminId(), testId);
                return Ok(new StartAttemptResponseDto(attempt.Id, attempt.Status, attempt.StartTime, attempt.LastSavedTime, attempt.LastQuestionIndex));
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        }

        [HttpGet("{testId}/attempt")]
        public async Task<IActionResult> GetAttempt(int testId)
        {
            AttemptDto? attemptDto;
            try
            {
                attemptDto = await _attemptService.GetAttemptAsync(GetUserId(), GetAdminId(), testId);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            if (attemptDto == null) return NotFound(new { message = "No active attempt found." });
            return Ok(attemptDto);
        }
    }
}
