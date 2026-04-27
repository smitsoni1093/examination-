using System.Security.Claims;
using ExamAPI.DTOs;
using ExamAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/attempts")]
    [Authorize(Roles = "User")]
    public class AttemptsController : ControllerBase
    {
        private readonly AttemptService _attemptService;

        public AttemptsController(AttemptService attemptService) => _attemptService = attemptService;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private int GetAdminId()
        {
            var adminIdClaim = User.FindFirstValue("AdminId");
            if (string.IsNullOrWhiteSpace(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
                throw new UnauthorizedAccessException("AdminId claim missing. Please login again.");
            return adminId;
        }

        [HttpPost("{attemptId}/answer")]
        public async Task<IActionResult> SaveAnswer(int attemptId, [FromBody] SaveAttemptAnswerDto dto)
        {
            try
            {
                await _attemptService.SaveAnswerAsync(GetUserId(), GetAdminId(), attemptId, dto);
                return Ok(new { message = "Answer saved." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpPost("{attemptId}/submit")]
        public async Task<IActionResult> Submit(int attemptId)
        {
            try
            {
                await _attemptService.SubmitAttemptAsync(GetUserId(), GetAdminId(), attemptId);
                return Ok(new
                {
                    message = "Test submitted successfully. Result will be available after admin release.",
                    isResultPublished = false
                });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }
    }
}
