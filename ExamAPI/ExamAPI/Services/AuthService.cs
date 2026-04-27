using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace ExamAPI.Services
{
    public class AuthService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly ISmsService _smsService;
        private readonly ILogger<AuthService> _logger;
        private readonly IMemoryCache _cache;
        private const string OtpSelectionCachePrefix = "otp-selection:";

        public AuthService(
            AppDbContext db,
            IConfiguration config,
            ISmsService smsService,
            ILogger<AuthService> logger,
            IMemoryCache cache)
        {
            _db = db;
            _config = config;
            _smsService = smsService;
            _logger = logger;
            _cache = cache;
        }

        /// <summary>Validates credentials and returns a JWT token with user claims</summary>
        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var identifier = request.Username?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(identifier))
                return null;

            var user = await _db.Users
                .FirstOrDefaultAsync(u =>
                    u.Username.ToLower() == identifier ||
                    (u.Email != null && u.Email.ToLower() == identifier));

            if (user == null || string.IsNullOrWhiteSpace(user.PasswordHash) || !user.IsActive)
                return null;

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return null;

            var token = GenerateJwtToken(user);

            int? adminId = user.Role switch
            {
                "Admin" => user.Id,
                "User" => user.AdminId,
                _ => null
            };

            return new LoginResponse(token, user.Role, user.Name, user.Id, adminId);
        }

        public async Task<SendOtpResponseDto> SendOtpAsync(SendOtpRequest request)
        {
            var mobile = NormalizeMobileNumber(request.MobileNumber);
            if (!IsValidMobileNumber(mobile))
                throw new ApiException("MOBILE_INVALID", "Please enter a valid mobile number.");

            var user = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.MobileNumber == mobile);

            if (user == null)
                throw new ApiException("MOBILE_NOT_REGISTERED", "Mobile number is not registered.");

            var resendAfterSeconds = GetResendAfterSeconds();
            var now = DateTime.UtcNow;
            var latest = await _db.UserOtps
                .Where(o => o.MobileNumber == mobile)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (latest != null)
            {
                var elapsed = (int)(now - latest.CreatedAt).TotalSeconds;
                if (elapsed < resendAfterSeconds)
                    throw new ApiException("OTP_RESEND_WAIT", "Please wait before requesting another OTP.");
            }

            var activeOtps = await _db.UserOtps
                .Where(o => o.MobileNumber == mobile && !o.IsUsed && o.ExpiryTime > now)
                .ToListAsync();
            foreach (var active in activeOtps)
            {
                active.IsUsed = true;
            }

            var otp = GenerateOtp();
            var expiryMinutes = GetOtpExpiryMinutes();
            var otpRow = new UserOtp
            {
                MobileNumber = mobile,
                OTPCode = HashOtp(otp),
                ExpiryTime = now.AddMinutes(expiryMinutes),
                IsUsed = false,
                AttemptCount = 0,
                CreatedAt = now
            };

            _db.UserOtps.Add(otpRow);
            await _db.SaveChangesAsync();

            try
            {
                await _smsService.SendOtpAsync(mobile, otp);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP SMS for mobile {Mobile}", mobile);
                throw new ApiException("OTP_SEND_FAILED", "Unable to send OTP right now. Please try again.");
            }

            return new SendOtpResponseDto(MaskMobile(mobile), expiryMinutes * 60, resendAfterSeconds);
        }

        public async Task<VerifyOtpResultDto> LookupMobileAsync(LookupMobileRequest request)
        {
            var mobile = NormalizeMobileNumber(request.MobileNumber);
            if (!IsValidMobileNumber(mobile))
                throw new ApiException("MOBILE_INVALID", "Please enter a valid mobile number.");

            var matchedUsers = await _db.Users
                .Include(u => u.Class)
                .Where(u => u.MobileNumber == mobile)
                .OrderBy(u => u.Name)
                .ThenBy(u => u.Email)
                .ToListAsync();

            if (matchedUsers.Count == 0)
                throw new ApiException("MOBILE_NOT_REGISTERED", "Mobile number is not registered.");

            return CreateSelectionResult(mobile, matchedUsers);
        }

        public async Task<VerifyOtpResultDto> VerifyOtpAsync(VerifyOtpRequest request)
        {
            var mobile = NormalizeMobileNumber(request.MobileNumber);
            if (!IsValidMobileNumber(mobile))
                throw new ApiException("MOBILE_INVALID", "Please enter a valid mobile number.");

            if (string.IsNullOrWhiteSpace(request.Otp) || request.Otp.Trim().Length != 6 || !request.Otp.Trim().All(char.IsDigit))
                throw new ApiException("OTP_INVALID", "Invalid OTP.");

            var now = DateTime.UtcNow;
            var otpRow = await _db.UserOtps
                .Where(o => o.MobileNumber == mobile)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (otpRow == null)
                throw new ApiException("OTP_INVALID", "Invalid OTP.");

            if (otpRow.IsUsed)
                throw new ApiException("OTP_ALREADY_USED", "OTP already used.");

            if (otpRow.ExpiryTime <= now)
            {
                otpRow.IsUsed = true;
                await _db.SaveChangesAsync();
                throw new ApiException("OTP_EXPIRED", "OTP has expired.");
            }

            var maxAttempts = GetMaxOtpAttempts();
            if (otpRow.AttemptCount >= maxAttempts)
            {
                otpRow.IsUsed = true;
                await _db.SaveChangesAsync();
                throw new ApiException("OTP_MAX_ATTEMPTS", "Maximum OTP attempts reached.");
            }

            var isMatch = otpRow.OTPCode == HashOtp(request.Otp.Trim());
            if (!isMatch)
            {
                otpRow.AttemptCount++;
                if (otpRow.AttemptCount >= maxAttempts)
                    otpRow.IsUsed = true;

                await _db.SaveChangesAsync();
                throw new ApiException("OTP_INVALID", "Invalid OTP.");
            }

            var matchedUsers = await _db.Users
                .Include(u => u.Class)
                .Where(u => u.MobileNumber == mobile)
                .OrderBy(u => u.Name)
                .ThenBy(u => u.Email)
                .ToListAsync();

            if (matchedUsers.Count == 0)
                throw new ApiException("MOBILE_NOT_REGISTERED", "Mobile number is not registered.");

            otpRow.IsUsed = true;
            await _db.SaveChangesAsync();

            if (matchedUsers.Count == 1)
            {
                var login = await BuildLoginResponseAsync(matchedUsers[0]);
                return new VerifyOtpResultDto(false, login, null, null);
            }

            return CreateSelectionResult(mobile, matchedUsers);
        }

        public async Task<LoginResponse> CompleteOtpSelectionAsync(CompleteOtpSelectionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SelectionToken))
                throw new ApiException("OTP_SELECTION_INVALID", "Selection token is invalid.");

            var cacheKey = OtpSelectionCachePrefix + request.SelectionToken.Trim();
            if (!_cache.TryGetValue<OtpSelectionState>(cacheKey, out var state) || state == null)
                throw new ApiException("OTP_SELECTION_EXPIRED", "OTP verification session expired. Please request OTP again.");

            if (!state.UserIds.Contains(request.UserId))
                throw new ApiException("OTP_SELECTION_INVALID", "Selected account is not valid for this OTP session.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId && u.MobileNumber == state.MobileNumber);
            if (user == null)
                throw new ApiException("OTP_SELECTION_INVALID", "Selected account was not found.");

            _cache.Remove(cacheKey);
            return await BuildLoginResponseAsync(user);
        }

        private async Task<LoginResponse> BuildLoginResponseAsync(User user)
        {
            // Mark user as active if this is their first successful OTP login.
            if (!user.IsActive)
            {
                user.IsActive = true;
                await _db.SaveChangesAsync();
            }

            var token = GenerateJwtToken(user);
            int? adminId = user.Role switch
            {
                "Admin" => user.Id,
                "User" => user.AdminId,
                _ => null
            };

            return new LoginResponse(token, user.Role, user.Name, user.Id, adminId);
        }

        private VerifyOtpResultDto CreateSelectionResult(string mobile, List<User> matchedUsers)
        {
            var selectionToken = Guid.NewGuid().ToString("N");
            var cacheKey = OtpSelectionCachePrefix + selectionToken;
            var selectionState = new OtpSelectionState
            {
                MobileNumber = mobile,
                UserIds = matchedUsers.Select(u => u.Id).ToHashSet()
            };

            _cache.Set(cacheKey, selectionState, TimeSpan.FromMinutes(5));

            var accounts = matchedUsers
                .Select(u => new OtpAccountOptionDto(
                    u.Id,
                    u.Name,
                    u.Username,
                    u.Role,
                    u.Email ?? string.Empty,
                    u.MobileNumber,
                    u.RollNumber,
                    u.Class?.Name,
                    u.Address,
                    u.Pincode))
                .ToList();

            return new VerifyOtpResultDto(true, null, selectionToken, accounts);
        }

        private sealed class OtpSelectionState
        {
            public string MobileNumber { get; init; } = string.Empty;
            public HashSet<int> UserIds { get; init; } = new();
        }

        public async Task ValidateInvitationAsync(ValidateInviteRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                throw new ApiException("INVITE_INVALID", "Invitation token is invalid.");

            var tokenHash = HashToken(request.Token);
            var invitation = await _db.UserInvitations
                .AsNoTracking()
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.TokenHash == tokenHash);

            if (invitation == null)
                throw new ApiException("INVITE_INVALID", "Invitation token is invalid.");

            if (invitation.IsUsed)
                throw new ApiException("INVITE_ALREADY_USED", "Invitation token already used.");

            if (invitation.ExpiryDate < DateTime.UtcNow)
                throw new ApiException("INVITE_EXPIRED", "Invitation token has expired.");
        }

        public async Task SetPasswordAsync(SetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                throw new ApiException("INVITE_INVALID", "Invitation token is invalid.");

            ValidatePasswordStrength(request.Password);

            var tokenHash = HashToken(request.Token);
            var invitation = await _db.UserInvitations
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.TokenHash == tokenHash);

            if (invitation == null)
                throw new ApiException("INVITE_INVALID", "Invitation token is invalid.");

            if (invitation.IsUsed)
                throw new ApiException("INVITE_ALREADY_USED", "Invitation token already used.");

            if (invitation.ExpiryDate < DateTime.UtcNow)
                throw new ApiException("INVITE_EXPIRED", "Invitation token has expired.");

            var user = invitation.User;
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            user.IsActive = true;
            user.IsEmailVerified = true;

            invitation.IsUsed = true;
            invitation.UsedAt = DateTime.UtcNow;

            // Invalidate any other pending invitations for this user.
            var pendingInvites = await _db.UserInvitations
                .Where(i => i.UserId == user.Id && !i.IsUsed && i.Id != invitation.Id)
                .ToListAsync();
            foreach (var pending in pendingInvites)
            {
                pending.IsUsed = true;
                pending.UsedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }

        private static void ValidatePasswordStrength(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                throw new ApiException("PASSWORD_WEAK", "Password must be at least 8 characters.");

            var hasUpper = Regex.IsMatch(password, "[A-Z]");
            var hasLower = Regex.IsMatch(password, "[a-z]");
            var hasDigit = Regex.IsMatch(password, "[0-9]");
            var hasSpecial = Regex.IsMatch(password, "[^a-zA-Z0-9]");

            if (!(hasUpper && hasLower && hasDigit && hasSpecial))
                throw new ApiException("PASSWORD_WEAK", "Password must include upper, lower, number, and special character.");
        }

        private static string HashToken(string token)
        {
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hashBytes);
        }

        private static string GenerateOtp()
        {
            return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        }

        private static string HashOtp(string otp)
        {
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(otp));
            return Convert.ToHexString(hashBytes);
        }

        private int GetOtpExpiryMinutes()
        {
            return int.TryParse(_config["Otp:ExpiryMinutes"], out var value) ? Math.Max(1, value) : 5;
        }

        private int GetResendAfterSeconds()
        {
            return int.TryParse(_config["Otp:ResendAfterSeconds"], out var value) ? Math.Max(5, value) : 30;
        }

        private int GetMaxOtpAttempts()
        {
            return int.TryParse(_config["Otp:MaxAttempts"], out var value) ? Math.Max(1, value) : 3;
        }

        private static string NormalizeMobileNumber(string mobileNumber)
        {
            var digits = new string((mobileNumber ?? string.Empty).Where(char.IsDigit).ToArray());
            if (digits.Length == 12 && digits.StartsWith("91"))
                return digits.Substring(2);

            return digits;
        }

        private static bool IsValidMobileNumber(string mobileNumber)
        {
            return mobileNumber.Length == 10 && mobileNumber.All(char.IsDigit);
        }

        private static string MaskMobile(string mobile)
        {
            if (mobile.Length < 4)
                return mobile;

            var suffix = mobile.Substring(mobile.Length - 4);
            return $"******{suffix}";
        }

        private string GenerateJwtToken(User user)
        {
            var jwtConfig = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
            };

            // Add AdminId claim for scoping:
            // - Admin: AdminId = self Id
            // - User: AdminId = user's AdminId
            if (user.Role == "Admin")
                claims.Add(new Claim("AdminId", user.Id.ToString()));
            else if (user.Role == "User" && user.AdminId.HasValue)
                claims.Add(new Claim("AdminId", user.AdminId.Value.ToString()));

            var token = new JwtSecurityToken(
                issuer: jwtConfig["Issuer"],
                audience: jwtConfig["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
