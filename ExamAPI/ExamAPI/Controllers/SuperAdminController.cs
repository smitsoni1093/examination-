using ExamAPI.DTOs;
using ExamAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/superadmin")]
    [Authorize(Roles = "SuperAdmin")]
    public class SuperAdminController : ControllerBase
    {
        private readonly SuperAdminService _superAdminService;

        public SuperAdminController(SuperAdminService superAdminService) => _superAdminService = superAdminService;

        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateUserDto dto)
        {
            try
            {
                var admin = await _superAdminService.CreateAdminAsync(dto);
                return Ok(new { admin.Id, admin.Name, admin.Username, admin.Role, admin.IsActive });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpGet("admins")]
        public async Task<IActionResult> GetAdmins()
        {
            var admins = await _superAdminService.GetAdminsAsync();
            return Ok(admins.Select(a => new { a.Id, a.Name, a.Username, a.IsActive, a.CreatedAt }));
        }

        [HttpPatch("admins/{adminUserId}/active")]
        public async Task<IActionResult> SetAdminActive(int adminUserId, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                await _superAdminService.SetAdminActiveAsync(adminUserId, dto.IsActive);
                return Ok(new { message = "Admin status updated." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _superAdminService.GetAllUsersAsync();
            return Ok(users.Select(u => new { u.Id, u.Name, u.Username, u.Role, u.AdminId, u.IsActive, u.CreatedAt }));
        }

        [HttpGet("tests")]
        public async Task<IActionResult> GetAllTests()
        {
            var tests = await _superAdminService.GetAllTestsAsync();
            return Ok(tests);
        }

        [HttpGet("results")]
        public async Task<IActionResult> GetAllResults()
        {
            var results = await _superAdminService.GetAllResultsAsync();
            return Ok(results);
        }
    }
}
