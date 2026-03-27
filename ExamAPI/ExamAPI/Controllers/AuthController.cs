using ExamAPI.DTOs;
using ExamAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService) => _authService = authService;

        /// <summary>Login for both Admin and User roles</summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            if (result == null)
                return Unauthorized(new { message = "Invalid username or password." });

            return Ok(result);
        }
    }
}
