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
                return Unauthorized(new { messageKey = "INVALID_CREDENTIALS" });

            return Ok(result);
        }

        [HttpPost("validate-invite")]
        public async Task<IActionResult> ValidateInvite([FromBody] ValidateInviteRequest request)
        {
            await _authService.ValidateInvitationAsync(request);
            return Ok(new { success = true });
        }

        [HttpPost("set-password")]
        public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest request)
        {
            await _authService.SetPasswordAsync(request);
            return Ok(new { success = true, messageKey = "PASSWORD_SET_SUCCESS" });
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            var result = await _authService.SendOtpAsync(request);
            return Ok(new { success = true, messageKey = "OTP_SENT", data = result });
        }

        [HttpPost("lookup-mobile")]
        public async Task<IActionResult> LookupMobile([FromBody] LookupMobileRequest request)
        {
            var result = await _authService.LookupMobileAsync(request);
            return Ok(result);
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var result = await _authService.VerifyOtpAsync(request);
            return Ok(result);
        }

        [HttpPost("complete-otp-selection")]
        public async Task<IActionResult> CompleteOtpSelection([FromBody] CompleteOtpSelectionRequest request)
        {
            var result = await _authService.CompleteOtpSelectionAsync(request);
            return Ok(result);
        }
    }
}
