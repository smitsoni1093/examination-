using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Net.Mail;

namespace ExamAPI.Services
{
    public class AdminService
    {
        private const string SoftDeletedSourcePrefix = "__SOFT_DELETED__::";

        private readonly AppDbContext _db;
        private readonly ClassService _classService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;
        private readonly ILogger<AdminService> _logger;

        public AdminService(AppDbContext db, ClassService classService, IEmailService emailService, IConfiguration config, IMemoryCache cache, ILogger<AdminService> logger)
        {
            _db = db;
            _classService = classService;
            _emailService = emailService;
            _config = config;
            _cache = cache;
            _logger = logger;
        }

        // ── Users ──────────────────────────────────────────────────────────────

        public Task<User> CreateUserAsync(CreateUserDto dto) => CreateUserAsync(null, dto);

        public async Task<User> CreateUserAsync(int? adminId, CreateUserDto dto)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            if (await _db.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower()))
                throw new ApiException("USERNAME_TAKEN", $"Username '{dto.Username}' is already taken.", new object[] { dto.Username });

            int? classId = dto.ClassId;
            if (classId.HasValue)
            {
                await _classService.ValidateClassOwnershipAsync(adminId.Value, classId.Value);
            }
            else
            {
                classId = await _classService.GetOrCreateDefaultClassIdAsync(adminId.Value);
            }

            var user = new User
            {
                Name = dto.Name,
                Username = dto.Username,
                RollNumber = await GenerateNextRollNumberAsync(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "User",
                AdminId = adminId,
                ClassId = classId,
                IsActive = true
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return user;
        }

        public async Task<CreateUserResponseDto> CreateUserForOtpAsync(int? adminId, CreateInvitedUserDto dto)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            var email = dto.Email.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email))
                throw new ApiException("EMAIL_REQUIRED", "Email is required.");

            if (!IsValidEmail(email))
                throw new ApiException("EMAIL_INVALID", "Please enter a valid email address.");

            if (string.IsNullOrWhiteSpace(dto.FullName))
                throw new ApiException("NAME_REQUIRED", "Full name is required.");

            if (string.IsNullOrWhiteSpace(dto.MobileNumber))
                throw new ApiException("MOBILE_REQUIRED", "Mobile number is required.");

            var normalizedMobile = NormalizeMobile(dto.MobileNumber);
            var normalizedPincode = NormalizePincode(dto.Pincode);
            var normalizedAddress = NormalizeAddress(dto.Address);

            if (string.IsNullOrWhiteSpace(normalizedMobile) || !IsValidMobileNumber(normalizedMobile))
                throw new ApiException("MOBILE_INVALID", "Please enter a valid mobile number.");

            if (!string.IsNullOrWhiteSpace(normalizedPincode) && !IsValidPincode(normalizedPincode))
                throw new ApiException("PINCODE_INVALID", "Please enter a valid pincode.");

            int? classId = dto.ClassId;
            if (classId.HasValue)
            {
                await _classService.ValidateClassOwnershipAsync(adminId.Value, classId.Value);
            }
            else
            {
                classId = await _classService.GetOrCreateDefaultClassIdAsync(adminId.Value);
            }

            var username = await GenerateUniqueUsernameFromEmailAsync(email);

            User? user = null;
            for (var attempt = 0; attempt < 5; attempt++)
            {
                user = new User
                {
                    Name = dto.FullName.Trim(),
                    Email = email,
                    MobileNumber = normalizedMobile,
                    Pincode = normalizedPincode,
                    Address = normalizedAddress,
                    Username = username,
                    RollNumber = await GenerateNextRollNumberAsync(),
                    PasswordHash = null,
                    Role = "User",
                    AdminId = adminId,
                    ClassId = classId,
                    IsActive = true,
                    IsEmailVerified = true
                };

                _db.Users.Add(user);
                try
                {
                    await _db.SaveChangesAsync();
                    break;
                }
                catch (DbUpdateException ex) when (attempt < 4 && IsRollNumberUniqueConflict(ex))
                {
                    _db.Entry(user).State = EntityState.Detached;
                }
            }

            if (user == null || user.Id == 0)
                throw new InvalidOperationException("Unable to allocate roll number. Please retry.");

            return new CreateUserResponseDto(
                user.Id,
                user.Name,
                user.Email,
                user.Username,
                user.MobileNumber ?? string.Empty,
                user.RollNumber ?? string.Empty,
                user.Pincode,
                user.Address,
                user.ClassId
            );
        }

        public async Task<User> UpdateUserForOtpAsync(int? adminId, int userId, UpdateInvitedUserDto dto)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.Id == userId &&
                u.Role == "User" &&
                u.AdminId == adminId);

            if (user == null)
                throw new KeyNotFoundException("User not found.");

            var email = dto.Email.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email))
                throw new ApiException("EMAIL_REQUIRED", "Email is required.");

            if (!IsValidEmail(email))
                throw new ApiException("EMAIL_INVALID", "Please enter a valid email address.");

            if (string.IsNullOrWhiteSpace(dto.FullName))
                throw new ApiException("NAME_REQUIRED", "Full name is required.");

            if (string.IsNullOrWhiteSpace(dto.MobileNumber))
                throw new ApiException("MOBILE_REQUIRED", "Mobile number is required.");

            var normalizedMobile = NormalizeMobile(dto.MobileNumber);
            var normalizedPincode = NormalizePincode(dto.Pincode);
            var normalizedAddress = NormalizeAddress(dto.Address);

            if (string.IsNullOrWhiteSpace(normalizedMobile) || !IsValidMobileNumber(normalizedMobile))
                throw new ApiException("MOBILE_INVALID", "Please enter a valid mobile number.");

            if (!string.IsNullOrWhiteSpace(normalizedPincode) && !IsValidPincode(normalizedPincode))
                throw new ApiException("PINCODE_INVALID", "Please enter a valid pincode.");

            int? classId = dto.ClassId;
            if (classId.HasValue)
            {
                await _classService.ValidateClassOwnershipAsync(adminId.Value, classId.Value);
            }
            else
            {
                classId = await _classService.GetOrCreateDefaultClassIdAsync(adminId.Value);
            }

            user.Name = dto.FullName.Trim();
            user.Email = email;
            user.MobileNumber = normalizedMobile;
            user.Pincode = normalizedPincode;
            user.Address = normalizedAddress;
            user.ClassId = classId;

            await _db.SaveChangesAsync();
            return user;
        }

        public async Task DeleteUserAsync(int? adminId, int userId)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.Id == userId &&
                u.Role == "User" &&
                u.AdminId == adminId);

            if (user == null)
                throw new KeyNotFoundException("User not found.");

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }

        private async Task<string> GenerateUniqueUsernameFromEmailAsync(string email)
        {
            var localPart = email.Split('@')[0].Trim().ToLowerInvariant();
            var baseUsername = string.IsNullOrWhiteSpace(localPart)
                ? "user"
                : new string(localPart.Where(ch => char.IsLetterOrDigit(ch) || ch == '.' || ch == '_' || ch == '-').ToArray());

            if (string.IsNullOrWhiteSpace(baseUsername))
                baseUsername = "user";

            var candidate = baseUsername;
            var suffix = 1;

            while (await _db.Users.AnyAsync(u => u.Username.ToLower() == candidate.ToLower()))
            {
                candidate = $"{baseUsername}{suffix}";
                suffix++;
            }

            return candidate;
        }

        private async Task<string> GenerateUniqueUsernameFromEmailAsync(string email, HashSet<string>? reservedUsernames)
        {
            var localPart = email.Split('@')[0].Trim().ToLowerInvariant();
            var baseUsername = string.IsNullOrWhiteSpace(localPart)
                ? "user"
                : new string(localPart.Where(ch => char.IsLetterOrDigit(ch) || ch == '.' || ch == '_' || ch == '-').ToArray());

            if (string.IsNullOrWhiteSpace(baseUsername))
                baseUsername = "user";

            var candidate = baseUsername;
            var suffix = 1;

            while (await _db.Users.AnyAsync(u => u.Username.ToLower() == candidate.ToLower()) || (reservedUsernames != null && reservedUsernames.Contains(candidate.ToLowerInvariant())))
            {
                candidate = $"{baseUsername}{suffix}";
                suffix++;
            }

            reservedUsernames?.Add(candidate.ToLowerInvariant());
            return candidate;
        }

        private static string GenerateInvitationToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }

        private static string HashToken(string token)
        {
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hashBytes);
        }

        private static bool IsValidEmail(string email)
        {
            try
            {
                var parsed = new MailAddress(email);
                return parsed.Address.Equals(email, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private static string? NormalizeMobile(string? mobileNumber)
        {
            if (string.IsNullOrWhiteSpace(mobileNumber))
                return null;

            var digits = new string(mobileNumber.Where(char.IsDigit).ToArray());

            if (digits.Length == 12 && digits.StartsWith("91"))
                return digits.Substring(2);

            return digits;
        }

        private static bool IsValidMobileNumber(string mobileNumber)
        {
            return mobileNumber.Length == 10 && mobileNumber.All(char.IsDigit);
        }

        private static string? NormalizePincode(string? pincode)
        {
            if (string.IsNullOrWhiteSpace(pincode))
                return null;

            return pincode.Trim().ToUpperInvariant();
        }

        private static string? NormalizeAddress(string? address)
        {
            if (string.IsNullOrWhiteSpace(address))
                return null;

            return address.Trim();
        }

        private static bool IsValidPincode(string pincode)
        {
            if (pincode.Length < 4 || pincode.Length > 10)
                return false;

            return pincode.All(ch => char.IsLetterOrDigit(ch) || ch == '-' || ch == ' ');
        }

        private async Task<string> GenerateNextRollNumberAsync()
        {
            var nextSequence = await GetNextRollNumberSequenceAsync();
            return $"U{nextSequence}";
        }

        private async Task<int> GetNextRollNumberSequenceAsync()
        {
            var existingRollNumbers = await _db.Users
                .AsNoTracking()
                .Where(u => u.RollNumber != null && u.RollNumber.StartsWith("U"))
                .Select(u => u.RollNumber!)
                .ToListAsync();

            var maxSequence = 0;
            foreach (var rollNumber in existingRollNumbers)
            {
                if (rollNumber.Length <= 1)
                    continue;

                if (int.TryParse(rollNumber.Substring(1), out var number) && number > maxSequence)
                {
                    maxSequence = number;
                }
            }

            return maxSequence + 1;
        }

        private static bool IsRollNumberUniqueConflict(DbUpdateException ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;
            return message.Contains("IX_Users_RollNumber", StringComparison.OrdinalIgnoreCase)
                || message.Contains("RollNumber", StringComparison.OrdinalIgnoreCase);
        }

        public Task<List<User>> GetUsersAsync() => GetUsersAsync(null);

        public async Task<List<User>> GetUsersAsync(int? adminId) =>
            await _db.Users
                .Where(u => u.Role == "User" && (adminId == null || u.AdminId == adminId))
                .ToListAsync();

        public async Task<(List<User> Items, int TotalCount)> GetUsersPageAsync(int? adminId, int page, int pageSize)
        {
            var safePage = Math.Max(page, 1);
            var safePageSize = Math.Max(pageSize, 1);

            var query = _db.Users
                .Where(u => u.Role == "User" && (adminId == null || u.AdminId == adminId));

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(u => u.Id)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<UserImportSummaryDto> ImportUsersAsync(int adminId, IFormFile file)
        {
            var summary = new UserImportSummaryDto();

            var defaultClassId = await _classService.GetOrCreateDefaultClassIdAsync(adminId);
            var classRows = await _db.Classes
                .AsNoTracking()
                .Where(c => c.AdminId == adminId)
                .Select(c => new { c.Id, c.Name })
                .ToListAsync();

            var classNameToId = classRows
                .GroupBy(c => NormalizeClassKey(c.Name))
                .ToDictionary(g => g.Key, g => g.First().Id);
            var classIds = classRows.Select(c => c.Id).ToHashSet();

            using var reader = new StreamReader(file.OpenReadStream());
            var content = await reader.ReadToEndAsync();
            var lines = content.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);

            if (lines.Length <= 1)
            {
                summary.Errors.Add("CSV is empty. Add a header and at least one data row.");
                return summary;
            }

            summary.TotalRows = lines.Skip(1).Count(line => !string.IsNullOrWhiteSpace(line));

            var header = ParseCsvLine(lines[0]);
            if (header.Count < 3)
            {
                summary.Errors.Add("Invalid header. Expected: fullName,email,mobileNumber,class");
                summary.FailedCount = summary.TotalRows;
                return summary;
            }

            var headerMap = header
                .Select((value, index) => new { value = value.Trim().ToLowerInvariant(), index })
                .ToDictionary(x => x.value, x => x.index);

            var fullNameIndex = headerMap.ContainsKey("fullname")
                ? headerMap["fullname"]
                : (headerMap.ContainsKey("name") ? headerMap["name"] : -1);
            var emailIndex = headerMap.ContainsKey("email") ? headerMap["email"] : -1;
            var mobileIndex = headerMap.ContainsKey("mobilenumber")
                ? headerMap["mobilenumber"]
                : (headerMap.ContainsKey("mobile") ? headerMap["mobile"] : -1);
            var classIndex = headerMap.ContainsKey("class") ? headerMap["class"] : -1;

            if (fullNameIndex < 0 || emailIndex < 0 || mobileIndex < 0)
            {
                summary.Errors.Add("Missing required columns. Required: fullName,email,mobileNumber");
                summary.FailedCount = summary.TotalRows;
                return summary;
            }

            var existingUsernamesList = await _db.Users
                .AsNoTracking()
                .Select(u => u.Username.ToLower())
                .ToListAsync();
            var existingUsernames = existingUsernamesList.ToHashSet();
            var fileUsernames = new HashSet<string>();
            var usersToCreate = new List<User>();
            var nextRollSequence = await GetNextRollNumberSequenceAsync();

            for (int i = 1; i < lines.Length; i++)
            {
                var rowNumber = i + 1;
                var line = lines[i];
                if (string.IsNullOrWhiteSpace(line)) continue;

                try
                {
                    var parts = ParseCsvLine(line);

                    string GetValue(int idx) => idx >= 0 && idx < parts.Count ? parts[idx].Trim() : string.Empty;

                    var name = GetValue(fullNameIndex);
                    var email = GetValue(emailIndex).ToLowerInvariant();
                    var mobileRaw = GetValue(mobileIndex);
                    var classValue = classIndex >= 0 ? GetValue(classIndex) : string.Empty;

                    if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(mobileRaw))
                    {
                        summary.FailedCount++;
                        summary.Errors.Add($"Row {rowNumber}: FullName, Email and MobileNumber are required.");
                        continue;
                    }

                    if (!IsValidEmail(email))
                    {
                        summary.FailedCount++;
                        summary.Errors.Add($"Row {rowNumber}: Email '{email}' is invalid.");
                        continue;
                    }

                    var normalizedMobile = NormalizeMobile(mobileRaw);
                    if (string.IsNullOrWhiteSpace(normalizedMobile) || !IsValidMobileNumber(normalizedMobile))
                    {
                        summary.FailedCount++;
                        summary.Errors.Add($"Row {rowNumber}: Mobile number '{mobileRaw}' is invalid.");
                        continue;
                    }

                    int classId;
                    if (string.IsNullOrWhiteSpace(classValue) || classValue.Equals("default", StringComparison.OrdinalIgnoreCase))
                    {
                        classId = defaultClassId;
                    }
                    else if (int.TryParse(classValue, out var parsedClassId))
                    {
                        if (!classIds.Contains(parsedClassId))
                        {
                            summary.FailedCount++;
                            summary.Errors.Add($"Row {rowNumber}: Class id '{parsedClassId}' is not valid for this admin.");
                            continue;
                        }
                        classId = parsedClassId;
                    }
                    else
                    {
                        var classKey = NormalizeClassKey(classValue);
                        if (!classNameToId.TryGetValue(classKey, out classId))
                        {
                            // Auto-create missing class names to simplify bulk onboarding.
                            var createdClass = new ClassRoom
                            {
                                Name = classValue.Trim(),
                                AdminId = adminId
                            };
                            _db.Classes.Add(createdClass);
                            await _db.SaveChangesAsync();

                            classId = createdClass.Id;
                            classIds.Add(classId);
                            classNameToId[classKey] = classId;
                        }
                    }

                    usersToCreate.Add(new User
                    {
                        Name = name,
                        Email = email,
                        MobileNumber = normalizedMobile,
                        RollNumber = $"U{nextRollSequence++}",
                        Username = await GenerateUniqueUsernameFromEmailAsync(email),
                        PasswordHash = null,
                        Role = "User",
                        AdminId = adminId,
                        ClassId = classId,
                        IsActive = true,
                        IsEmailVerified = true
                    });

                    var generatedUsername = usersToCreate.Last().Username.ToLowerInvariant();
                    existingUsernames.Add(generatedUsername);
                    fileUsernames.Add(generatedUsername);
                    summary.SuccessCount++;
                }
                catch (Exception ex)
                {
                    summary.FailedCount++;
                    summary.Errors.Add($"Row {rowNumber}: {ex.Message}");
                }
            }

            if (usersToCreate.Count > 0)
            {
                await _db.Users.AddRangeAsync(usersToCreate);
                await _db.SaveChangesAsync();
            }

            return summary;
        }

        public async Task<UserImportInitResponseDto> InitializeUserImportAsync(int? adminId, IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileBytes = await ReadFileBytesAsync(file);
            var parsed = ParseUserImportFile(fileBytes, extension);
            var sessionId = Guid.NewGuid().ToString("N");

            var state = new UserImportSessionState
            {
                SessionId = sessionId,
                AdminId = adminId,
                FileName = file.FileName,
                FileType = extension,
                Headers = parsed.Headers,
                Rows = parsed.Rows,
                TotalRows = parsed.Rows.Count,
                CreatedAtUtc = DateTime.UtcNow
            };

            _cache.Set(GetUserImportCacheKey(adminId, sessionId), state, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });

            return new UserImportInitResponseDto(
                sessionId,
                file.FileName,
                extension.TrimStart('.'),
                parsed.Rows.Count,
                parsed.Headers);
        }

        public async Task<UserImportPreviewResponseDto> PreviewUserImportAsync(int? adminId, UserImportPreviewRequestDto request)
        {
            var state = GetUserImportSession(adminId, request.SessionId);
            return await BuildUserImportPreviewAsync(state, request.Mapping, request.SkipInvalidRows);
        }

        public async Task<ImportSummaryDto> ConfirmUserImportAsync(int? adminId, UserImportConfirmRequestDto request)
        {
            var state = GetUserImportSession(adminId, request.SessionId);
            var parsedRows = await BuildUserImportRowsAsync(state, request.Mapping);
            var summary = new ImportSummaryDto
            {
                TotalRows = state.TotalRows,
                FailedCount = parsedRows.Count(row => !row.IsValid)
            };

            var validRows = parsedRows.Where(row => row.IsValid && row.Candidate != null).ToList();
            if (!request.SkipInvalidRows && parsedRows.Any(row => !row.IsValid))
            {
                summary.Errors = parsedRows.Where(row => !row.IsValid)
                    .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                    .ToList();
                return summary;
            }

            if (!validRows.Any())
            {
                summary.SkippedCount = parsedRows.Count(row => !row.IsValid);
                summary.Errors = parsedRows.Where(row => !row.IsValid)
                    .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                    .ToList();
                return summary;
            }

            var classRows = await _db.Classes
                .AsNoTracking()
                .Where(c => c.AdminId == state.AdminId)
                .Select(c => new { c.Id, c.Name })
                .ToListAsync();

            var classNameToId = classRows
                .GroupBy(c => NormalizeClassKey(c.Name))
                .ToDictionary(g => g.Key, g => g.First().Id);
            var classIds = classRows.Select(c => c.Id).ToHashSet();
            var defaultClassId = await _classService.GetOrCreateDefaultClassIdAsync(state.AdminId ?? throw new InvalidOperationException("AdminId is required."));

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var usersToInsert = new List<User>();
                var nextRollSequence = await GetNextRollNumberSequenceAsync();
                foreach (var row in validRows)
                {
                    var candidate = row.Candidate!;
                    var classId = await ResolveUserImportClassIdAsync(state.AdminId ?? throw new InvalidOperationException("AdminId is required."), candidate, defaultClassId, classNameToId, classIds);

                    usersToInsert.Add(new User
                    {
                        Name = candidate.Name,
                        Email = candidate.Email,
                        MobileNumber = candidate.MobileNumber,
                        Pincode = candidate.Pincode,
                        Address = candidate.Address,
                        Username = candidate.Username,
                        RollNumber = $"U{nextRollSequence++}",
                        PasswordHash = null,
                        Role = "User",
                        AdminId = state.AdminId,
                        ClassId = classId,
                        IsActive = true,
                        IsEmailVerified = true
                    });
                }

                if (usersToInsert.Any())
                {
                    await _db.Users.AddRangeAsync(usersToInsert);
                    await _db.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                summary.SuccessCount = usersToInsert.Count;
                summary.SkippedCount = parsedRows.Count(row => !row.IsValid);
                summary.Errors = parsedRows.Where(row => !row.IsValid)
                    .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                    .ToList();
                _cache.Remove(GetUserImportCacheKey(adminId, request.SessionId));
                return summary;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task<UserImportPreviewResponseDto> BuildUserImportPreviewAsync(UserImportSessionState state, UserImportMappingDto mapping, bool skipInvalidRows)
        {
            var parsedRows = await BuildUserImportRowsAsync(state, mapping);
            var rows = parsedRows
                .Take(10)
                .Select(row => new UserImportRowPreviewDto(row.RowNumber, row.Values, row.IsValid, row.Errors))
                .ToList();

            var errors = parsedRows
                .Where(row => !row.IsValid)
                .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                .Take(25)
                .ToList();

            return new UserImportPreviewResponseDto(
                state.SessionId,
                state.TotalRows,
                parsedRows.Count(row => row.IsValid),
                parsedRows.Count(row => !row.IsValid),
                rows,
                errors);
        }

        private async Task<List<UserImportParsedRow>> BuildUserImportRowsAsync(UserImportSessionState state, UserImportMappingDto mapping)
        {
            var mappingErrors = ValidateUserImportMapping(state, mapping);
            if (mappingErrors.Any())
            {
                return new List<UserImportParsedRow>
                {
                    new UserImportParsedRow(
                        0,
                        new Dictionary<string, string>(),
                        mappingErrors,
                        null)
                };
            }

            var classRows = await _db.Classes
                .AsNoTracking()
                .Where(c => c.AdminId == state.AdminId)
                .Select(c => new { c.Id, c.Name })
                .ToListAsync();
            var classIds = classRows.Select(c => c.Id).ToHashSet();

            var reservedUsernames = new HashSet<string>();
            var rows = new List<UserImportParsedRow>();

            for (int i = 0; i < state.Rows.Count; i++)
            {
                var rowNumber = i + 2;
                var rowValues = state.Rows[i];
                rows.Add(await MapUserImportRowAsync(
                    rowNumber,
                    rowValues,
                    mapping,
                    state.AdminId,
                    classIds,
                    reservedUsernames));
            }

            return rows;
        }

        private static List<string> ValidateUserImportMapping(UserImportSessionState state, UserImportMappingDto mapping)
        {
            var errors = new List<string>();
            var headerCount = state.Headers.Count;
            var selectedColumns = new Dictionary<int, string>();

            void ValidateColumn(string fieldName, int? columnIndex, bool required)
            {
                if (!columnIndex.HasValue)
                {
                    if (required)
                    {
                        errors.Add($"{fieldName} is required.");
                    }

                    return;
                }

                if (columnIndex.Value < 1 || columnIndex.Value > headerCount)
                {
                    errors.Add($"{fieldName} column is out of range.");
                    return;
                }

                if (selectedColumns.TryGetValue(columnIndex.Value, out var existingField))
                {
                    errors.Add($"Column '{state.Headers[columnIndex.Value - 1].Header}' is mapped to both {existingField} and {fieldName}.");
                    return;
                }

                selectedColumns[columnIndex.Value] = fieldName;
            }

            ValidateColumn("Full Name", mapping.FullName, true);
            ValidateColumn("Email", mapping.Email, true);
            ValidateColumn("Mobile Number", mapping.MobileNumber, true);
            ValidateColumn("Pincode", mapping.Pincode, false);
            ValidateColumn("Address", mapping.Address, false);
            ValidateColumn("Class", mapping.Class, false);

            return errors;
        }

        private async Task<UserImportParsedRow> MapUserImportRowAsync(
            int rowNumber,
            IReadOnlyList<string> rowValues,
            UserImportMappingDto mapping,
            int? adminId,
            HashSet<int> classIds,
            HashSet<string> reservedUsernames)
        {
            string GetValue(int? columnIndex)
            {
                if (!columnIndex.HasValue || columnIndex.Value < 1) return string.Empty;
                var zeroBased = columnIndex.Value - 1;
                if (zeroBased >= rowValues.Count) return string.Empty;
                return rowValues[zeroBased]?.Trim() ?? string.Empty;
            }

            var name = GetValue(mapping.FullName);
            var email = GetValue(mapping.Email).ToLowerInvariant();
            var mobileRaw = GetValue(mapping.MobileNumber);
            var pincodeRaw = GetValue(mapping.Pincode);
            var addressRaw = GetValue(mapping.Address);
            var classValue = GetValue(mapping.Class);

            var values = new Dictionary<string, string>
            {
                ["Full Name"] = name,
                ["Email"] = email,
                ["Mobile Number"] = mobileRaw,
                ["Pincode"] = pincodeRaw,
                ["Address"] = addressRaw,
                ["Class"] = classValue
            };

            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(name)) errors.Add("Full Name is required.");
            if (string.IsNullOrWhiteSpace(email)) errors.Add("Email is required.");
            if (string.IsNullOrWhiteSpace(mobileRaw)) errors.Add("Mobile Number is required.");

            if (!string.IsNullOrWhiteSpace(email) && !IsValidEmail(email))
            {
                errors.Add($"Email '{email}' is invalid.");
            }

            var normalizedMobile = NormalizeMobile(mobileRaw);
            var normalizedPincode = NormalizePincode(pincodeRaw);
            var normalizedAddress = NormalizeAddress(addressRaw);
            if (string.IsNullOrWhiteSpace(normalizedMobile) || !IsValidMobileNumber(normalizedMobile))
            {
                errors.Add($"Mobile number '{mobileRaw}' is invalid.");
            }

            if (!string.IsNullOrWhiteSpace(normalizedPincode) && !IsValidPincode(normalizedPincode))
            {
                errors.Add($"Pincode '{pincodeRaw}' is invalid.");
            }

            int? classId = null;
            string? normalizedClassValue = null;
            if (!string.IsNullOrWhiteSpace(classValue) && !classValue.Equals("default", StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(classValue, out var parsedClassId))
                {
                    if (!classIds.Contains(parsedClassId))
                    {
                        errors.Add($"Class id '{parsedClassId}' is not valid for this admin.");
                    }
                    else
                    {
                        classId = parsedClassId;
                    }
                }
                else
                {
                    normalizedClassValue = classValue.Trim();
                }
            }

            string? username = null;
            if (!errors.Any())
            {
                username = await GenerateUniqueUsernameFromEmailAsync(email, reservedUsernames);
            }

            UserImportRowCandidate? candidate = null;
            if (!errors.Any())
            {
                candidate = new UserImportRowCandidate(
                    name,
                    email,
                    normalizedMobile!,
                    normalizedPincode,
                    normalizedAddress,
                    normalizedClassValue,
                    classId,
                    username!);
            }

            return new UserImportParsedRow(rowNumber, values, errors, candidate);
        }

        private async Task<int> ResolveUserImportClassIdAsync(
            int? adminId,
            UserImportRowCandidate candidate,
            int defaultClassId,
            Dictionary<string, int> classNameToId,
            HashSet<int> classIds)
        {
            var resolvedAdminId = adminId ?? throw new InvalidOperationException("AdminId is required.");

            if (candidate.ClassId.HasValue)
            {
                return candidate.ClassId.Value;
            }

            if (string.IsNullOrWhiteSpace(candidate.ClassValue))
            {
                return defaultClassId;
            }

            var classKey = NormalizeClassKey(candidate.ClassValue);
            if (classNameToId.TryGetValue(classKey, out var existingClassId))
            {
                return existingClassId;
            }

            var createdClass = new ClassRoom
            {
                Name = candidate.ClassValue.Trim(),
                AdminId = resolvedAdminId
            };
            _db.Classes.Add(createdClass);
            await _db.SaveChangesAsync();

            classIds.Add(createdClass.Id);
            classNameToId[classKey] = createdClass.Id;
            return createdClass.Id;
        }

        private static UserImportFileData ParseUserImportFile(byte[] fileBytes, string extension)
        {
            if (extension == ".xlsx")
            {
                using var stream = new MemoryStream(fileBytes);
                using var package = new ExcelPackage(stream);
                var worksheet = package.Workbook.Worksheets.FirstOrDefault();

                if (worksheet?.Dimension == null)
                    throw new InvalidOperationException("The Excel file does not contain any rows.");

                var rowCount = worksheet.Dimension.Rows;
                var columnCount = worksheet.Dimension.Columns;
                var headers = Enumerable.Range(1, columnCount)
                    .Select(col => new UserImportHeaderDto(col, worksheet.Cells[1, col].Text ?? string.Empty))
                    .ToList();

                var rows = new List<List<string>>();
                for (int row = 2; row <= rowCount; row++)
                {
                    var values = Enumerable.Range(1, columnCount)
                        .Select(col => worksheet.Cells[row, col].Text ?? string.Empty)
                        .ToList();

                    if (values.Any(value => !string.IsNullOrWhiteSpace(value)))
                    {
                        rows.Add(values);
                    }
                }

                return new UserImportFileData(headers, rows);
            }

            if (extension == ".csv")
            {
                var content = Encoding.UTF8.GetString(fileBytes);
                var lines = content.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);

                if (lines.Length == 0 || string.IsNullOrWhiteSpace(lines[0]))
                    throw new InvalidOperationException("The CSV file does not contain a header row.");

                var headerValues = ParseCsvLine(lines[0]);
                if (headerValues.Count > 0)
                {
                    headerValues[0] = headerValues[0].TrimStart('\uFEFF');
                }

                var headers = headerValues
                    .Select((header, index) => new UserImportHeaderDto(index + 1, header))
                    .ToList();

                var rows = new List<List<string>>();
                for (int i = 1; i < lines.Length; i++)
                {
                    if (string.IsNullOrWhiteSpace(lines[i])) continue;
                    var values = ParseCsvLine(lines[i]);
                    if (values.Any(value => !string.IsNullOrWhiteSpace(value)))
                    {
                        rows.Add(values);
                    }
                }

                return new UserImportFileData(headers, rows);
            }

            throw new InvalidOperationException("Only .xlsx and .csv files are supported.");
        }

        private string GetUserImportCacheKey(int? adminId, string sessionId) => $"user-import:{adminId ?? 0}:{sessionId}";

        private UserImportSessionState GetUserImportSession(int? adminId, string sessionId)
        {
            if (_cache.TryGetValue(GetUserImportCacheKey(adminId, sessionId), out object? cached) && cached is UserImportSessionState state)
            {
                return state;
            }

            throw new KeyNotFoundException("User import session expired. Please upload the file again.");
        }

        private sealed record UserImportFileData(List<UserImportHeaderDto> Headers, List<List<string>> Rows);

        private sealed record UserImportRowCandidate(string Name, string Email, string MobileNumber, string? Pincode, string? Address, string? ClassValue, int? ClassId, string Username);

        private sealed record UserImportParsedRow(int RowNumber, Dictionary<string, string> Values, List<string> Errors, UserImportRowCandidate? Candidate)
        {
            public bool IsValid => Errors.Count == 0 && Candidate != null;
        }

        private sealed class UserImportSessionState
        {
            public string SessionId { get; set; } = string.Empty;
            public int? AdminId { get; set; }
            public string FileName { get; set; } = string.Empty;
            public string FileType { get; set; } = string.Empty;
            public List<UserImportHeaderDto> Headers { get; set; } = new List<UserImportHeaderDto>();
            public List<List<string>> Rows { get; set; } = new List<List<string>>();
            public int TotalRows { get; set; }
            public DateTime CreatedAtUtc { get; set; }
        }

        private static string NormalizeClassKey(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var parts = value
                .Trim()
                .ToLower()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries);

            return string.Join(" ", parts);
        }

        private static List<string> ParseCsvLine(string line)
        {
            var values = new List<string>();
            if (line == null) return values;

            var current = new System.Text.StringBuilder();
            var inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                var ch = line[i];

                if (ch == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }

                    continue;
                }

                if (ch == ',' && !inQuotes)
                {
                    values.Add(current.ToString());
                    current.Clear();
                    continue;
                }

                current.Append(ch);
            }

            values.Add(current.ToString());
            return values;
        }

        // ── Questions ──────────────────────────────────────────────────────────

        public Task<Question> CreateQuestionAsync(CreateQuestionDto dto) => CreateQuestionAsync(null, dto);

        public async Task<Question> CreateQuestionAsync(int? adminId, CreateQuestionDto dto)
        {
            if (dto.CorrectOption < 1 || dto.CorrectOption > 4)
                throw new ArgumentException("CorrectOption must be between 1 and 4.");

            var q = new Question
            {
                Question_EN = dto.Question_EN, Option1_EN = dto.Option1_EN, Option2_EN = dto.Option2_EN,
                Option3_EN = dto.Option3_EN, Option4_EN = dto.Option4_EN,
                Question_HI = dto.Question_HI, Option1_HI = dto.Option1_HI, Option2_HI = dto.Option2_HI,
                Option3_HI = dto.Option3_HI, Option4_HI = dto.Option4_HI,
                Question_GU = dto.Question_GU, Option1_GU = dto.Option1_GU, Option2_GU = dto.Option2_GU,
                Option3_GU = dto.Option3_GU, Option4_GU = dto.Option4_GU,
                CorrectOption = dto.CorrectOption,
                AdminId = adminId
            };
            _db.Questions.Add(q);
            await _db.SaveChangesAsync();
            return q;
        }

        public Task UpdateQuestionAsync(int id, Question updated) => UpdateQuestionAsync(null, id, updated);

        public async Task UpdateQuestionAsync(int? adminId, int id, Question updated)
        {
            var q = await _db.Questions.FirstOrDefaultAsync(x => x.Id == id && (adminId == null || x.AdminId == adminId));
            if (q == null) throw new KeyNotFoundException("Item not found");

            q.Question_EN = updated.Question_EN; q.Option1_EN = updated.Option1_EN; q.Option2_EN = updated.Option2_EN; q.Option3_EN = updated.Option3_EN; q.Option4_EN = updated.Option4_EN;
            q.Question_HI = updated.Question_HI; q.Option1_HI = updated.Option1_HI; q.Option2_HI = updated.Option2_HI; q.Option3_HI = updated.Option3_HI; q.Option4_HI = updated.Option4_HI;
            q.Question_GU = updated.Question_GU; q.Option1_GU = updated.Option1_GU; q.Option2_GU = updated.Option2_GU; q.Option3_GU = updated.Option3_GU; q.Option4_GU = updated.Option4_GU;
            q.CorrectOption = updated.CorrectOption;
            
            await _db.SaveChangesAsync();
        }

        public Task<List<Question>> GetQuestionsAsync(string? sourceFileName = null, string? search = null, int? skip = null, int? take = null)
            => GetQuestionsAsync(null, sourceFileName, search, skip, take);

        public async Task<List<Question>> GetQuestionsAsync(int? adminId, string? sourceFileName = null, string? search = null, int? skip = null, int? take = null)
        {
            var query = _db.Questions.AsQueryable();
            if (adminId != null) query = query.Where(q => q.AdminId == adminId);
            query = query.Where(q => q.SourceFileName == null || !q.SourceFileName.StartsWith(SoftDeletedSourcePrefix));
            if (!string.IsNullOrEmpty(sourceFileName)) 
                query = query.Where(q => q.SourceFileName == sourceFileName);
            if (!string.IsNullOrEmpty(search)) 
                query = query.Where(q => q.Question_EN.Contains(search) || q.Id.ToString() == search);
            
            IQueryable<Question> finalResult = query.OrderByDescending(q => q.CreatedAt);
            
            if (skip.HasValue) finalResult = finalResult.Skip(skip.Value);
            if (take.HasValue) finalResult = finalResult.Take(take.Value);

            return await finalResult.ToListAsync();
        }

        public async Task<(List<Question> Items, int TotalCount)> GetQuestionsPageAsync(int? adminId, string? sourceFileName = null, string? search = null, int skip = 0, int take = 20)
        {
            var safeSkip = Math.Max(skip, 0);
            var safeTake = Math.Max(take, 1);

            var query = _db.Questions.AsQueryable();
            if (adminId != null) query = query.Where(q => q.AdminId == adminId);
            query = query.Where(q => q.SourceFileName == null || !q.SourceFileName.StartsWith(SoftDeletedSourcePrefix));
            if (!string.IsNullOrEmpty(sourceFileName))
                query = query.Where(q => q.SourceFileName == sourceFileName);
            if (!string.IsNullOrEmpty(search))
                query = query.Where(q => q.Question_EN.Contains(search) || q.Id.ToString() == search);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(q => q.CreatedAt)
                .Skip(safeSkip)
                .Take(safeTake)
                .ToListAsync();

            return (items, totalCount);
        }

        public Task<List<string>> GetQuestionSourcesAsync() => GetQuestionSourcesAsync(null);

        public async Task<List<string>> GetQuestionSourcesAsync(int? adminId)
        {
            var query = _db.Questions.AsQueryable();
            if (adminId != null) query = query.Where(q => q.AdminId == adminId);
            query = query.Where(q =>
                q.SourceFileName != null &&
                q.SourceFileName != string.Empty &&
                !q.SourceFileName.StartsWith(SoftDeletedSourcePrefix));

            return await query
                .Select(q => q.SourceFileName)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();
        }

        public Task<List<QuestionSourceFileDto>> GetQuestionSourceFilesAsync() => GetQuestionSourceFilesAsync(null);

        public async Task<List<QuestionSourceFileDto>> GetQuestionSourceFilesAsync(int? adminId)
        {
            var query = _db.Questions.AsQueryable();
            if (adminId != null) query = query.Where(q => q.AdminId == adminId);

            query = query.Where(q =>
                q.SourceFileName != null &&
                q.SourceFileName != string.Empty &&
                !q.SourceFileName.StartsWith(SoftDeletedSourcePrefix));

            var sourceQuestions = await query
                .Select(q => new { q.Id, q.SourceFileName, q.CreatedAt })
                .ToListAsync();

            if (sourceQuestions.Count == 0)
                return new List<QuestionSourceFileDto>();

            var questionIds = sourceQuestions.Select(x => x.Id).ToList();
            var usedQuestionIds = await _db.TestQuestions
                .Where(tq => questionIds.Contains(tq.QuestionId))
                .Select(tq => tq.QuestionId)
                .Distinct()
                .ToListAsync();

            var usedSet = usedQuestionIds.ToHashSet();

            return sourceQuestions
                .GroupBy(x => x.SourceFileName!)
                .Select(g =>
                {
                    var usedCount = g.Count(x => usedSet.Contains(x.Id));
                    return new QuestionSourceFileDto(
                        g.Key,
                        g.Count(),
                        usedCount,
                        usedCount == 0,
                        g.Max(x => x.CreatedAt)
                    );
                })
                .OrderByDescending(x => x.LastImportedAt)
                .ToList();
        }

        public Task SoftDeleteQuestionSourceAsync(string sourceFileName) => SoftDeleteQuestionSourceAsync(null, sourceFileName);

        public async Task SoftDeleteQuestionSourceAsync(int? adminId, string sourceFileName)
        {
            var normalizedSource = sourceFileName?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedSource))
                throw new ApiException("SOURCE_REQUIRED", "Source file name is required.");

            if (normalizedSource.StartsWith(SoftDeletedSourcePrefix, StringComparison.OrdinalIgnoreCase))
                throw new ApiException("SOURCE_ALREADY_DELETED", "Source file is already deleted.");

            var query = _db.Questions.Where(q => q.SourceFileName == normalizedSource);
            if (adminId != null) query = query.Where(q => q.AdminId == adminId);

            var questions = await query.ToListAsync();
            if (questions.Count == 0)
                throw new KeyNotFoundException("Source file not found.");

            var usedQuestionIds = await _db.TestQuestions
                .Where(tq => questions.Select(q => q.Id).Contains(tq.QuestionId))
                .Select(tq => tq.QuestionId)
                .Distinct()
                .ToListAsync();

            if (usedQuestionIds.Count > 0)
                throw new ApiException("QUESTION_SOURCE_IN_USE", "Cannot delete source file because some questions are assigned to tests.");

            var archivedName = $"{SoftDeletedSourcePrefix}{DateTime.UtcNow:yyyyMMddHHmmss}::{normalizedSource}";
            foreach (var question in questions)
            {
                question.SourceFileName = archivedName;
            }

            await _db.SaveChangesAsync();
        }

        // ── Instructions ───────────────────────────────────────────────────────

        public async Task<List<InstructionDto>> GetInstructionsAsync(int? adminId)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            return await _db.Instructions
                .AsNoTracking()
                .Where(i => !i.IsDeleted && i.AdminId == adminId)
                .OrderBy(i => i.CreatedAt)
                .Select(i => new InstructionDto(i.Id, i.Text, i.IsActive, i.CreatedAt))
                .ToListAsync();
        }

        public async Task<InstructionDto> CreateInstructionAsync(int? adminId, CreateInstructionDto dto)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            var text = (dto.Text ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(text))
                throw new ApiException("INSTRUCTION_TEXT_REQUIRED", "Instruction text is required.");

            var instruction = new Instruction
            {
                Text = text,
                IsActive = dto.IsActive,
                AdminId = adminId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Instructions.Add(instruction);
            await _db.SaveChangesAsync();

            return new InstructionDto(instruction.Id, instruction.Text, instruction.IsActive, instruction.CreatedAt);
        }

        public async Task<InstructionDto> UpdateInstructionAsync(int? adminId, int instructionId, UpdateInstructionDto dto)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            var instruction = await _db.Instructions
                .FirstOrDefaultAsync(i => i.Id == instructionId && i.AdminId == adminId && !i.IsDeleted);

            if (instruction == null)
                throw new KeyNotFoundException("Instruction not found.");

            var text = (dto.Text ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(text))
                throw new ApiException("INSTRUCTION_TEXT_REQUIRED", "Instruction text is required.");

            instruction.Text = text;
            instruction.IsActive = dto.IsActive;
            await _db.SaveChangesAsync();

            return new InstructionDto(instruction.Id, instruction.Text, instruction.IsActive, instruction.CreatedAt);
        }

        public async Task DeleteInstructionAsync(int? adminId, int instructionId)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            var instruction = await _db.Instructions
                .FirstOrDefaultAsync(i => i.Id == instructionId && i.AdminId == adminId && !i.IsDeleted);

            if (instruction == null)
                throw new KeyNotFoundException("Instruction not found.");

            instruction.IsDeleted = true;
            instruction.IsActive = false;
            await _db.SaveChangesAsync();
        }

        // ── Tests ──────────────────────────────────────────────────────────────

        public Task<List<AdminTestDto>> GetTestsAsync() => GetTestsAsync(null);

        public async Task<List<AdminTestDto>> GetTestsAsync(int? adminId)
        {
            return await _db.Tests
                .Where(t => !t.IsDeleted && (adminId == null || t.AdminId == adminId))
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new AdminTestDto(
                    t.Id,
                    t.Name,
                    t.Description,
                    t.Duration,
                    t.TotalMarks,
                    t.TestQuestions.Count,
                    t.IsActive,
                    t.CreatedAt,
                    t.IsGlobal,
                    t.ClassId,
                    t.Class != null ? t.Class.Name : null,
                    t.TestImageUrl,
                    t.ClosingAt,
                    t.TestInstructions
                        .OrderBy(ti => ti.OrderIndex)
                        .Select(ti => new TestInstructionDto(ti.InstructionId, ti.Instruction.Text, ti.OrderIndex))
                        .ToList()
                ))
                .ToListAsync();
        }

        public Task UpdateTestStatusAsync(int testId, bool isActive) => UpdateTestStatusAsync(null, testId, isActive);

        public async Task UpdateTestStatusAsync(int? adminId, int testId, bool isActive)
        {
            var test = await _db.Tests.FirstOrDefaultAsync(t => t.Id == testId && (adminId == null || t.AdminId == adminId));
            if (test != null)
            {
                if (test.IsDeleted) return;
                test.IsActive = isActive;
                await _db.SaveChangesAsync();
            }
        }

        public Task SoftDeleteTestAsync(int testId) => SoftDeleteTestAsync(null, testId);

        public async Task SoftDeleteTestAsync(int? adminId, int testId)
        {
            var test = await _db.Tests.FirstOrDefaultAsync(t => t.Id == testId && (adminId == null || t.AdminId == adminId));
            if (test == null) throw new KeyNotFoundException("Test not found.");

            if (!test.IsDeleted)
            {
                test.IsDeleted = true;
                test.IsActive = false;
                await _db.SaveChangesAsync();
            }
        }

        public Task<List<int>> GetTestQuestionIdsAsync(int testId) => GetTestQuestionIdsAsync(null, testId);

        public async Task<List<int>> GetTestQuestionIdsAsync(int? adminId, int testId)
        {
            if (adminId != null)
            {
                var testExists = await _db.Tests.AnyAsync(t => t.Id == testId && t.AdminId == adminId && !t.IsDeleted);
                if (!testExists) throw new KeyNotFoundException("Test not found.");
            }
            return await _db.TestQuestions
                .Where(tq => tq.TestId == testId)
                .OrderBy(tq => tq.OrderIndex)
                .Select(tq => tq.QuestionId)
                .ToListAsync();
        }

        public Task<Test> CreateTestAsync(CreateTestDto dto) => CreateTestAsync(null, dto);

        public async Task<Test> CreateTestAsync(int? adminId, CreateTestDto dto)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            var isGlobal = dto.IsGlobal ?? false;
            int? classId = null;
            var closingAt = NormalizeClosingAt(dto.ClosingAt);

            if (!isGlobal)
            {
                classId = dto.ClassId;
                if (classId.HasValue)
                {
                    await _classService.ValidateClassOwnershipAsync(adminId.Value, classId.Value);
                }
                else
                {
                    classId = await _classService.GetOrCreateDefaultClassIdAsync(adminId.Value);
                }
            }

            var test = new Test 
            { 
                Name = dto.Name, 
                Description = dto.Description ?? "", 
                TestImageUrl = NormalizeTestImageUrl(dto.TestImageUrl),
                ClosingAt = closingAt,
                Duration = dto.Duration,
                TotalMarks = dto.TotalMarks,
                AdminId = adminId,
                IsGlobal = isGlobal,
                ClassId = isGlobal ? null : classId
            };
            _db.Tests.Add(test);
            await _db.SaveChangesAsync();

            await ApplyTestInstructionsAsync(adminId.Value, test.Id, dto.InstructionIds);
            return test;
        }

        public Task<AdminTestDto> UpdateTestAsync(int testId, UpdateTestDto dto) => UpdateTestAsync(null, testId, dto);

        public async Task<AdminTestDto> UpdateTestAsync(int? adminId, int testId, UpdateTestDto dto)
        {
            if (adminId == null) throw new InvalidOperationException("AdminId is required.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ApiException("TEST_NAME_REQUIRED", "Test name is required.");

            if (dto.Duration < 0)
                throw new ApiException("TEST_DURATION_INVALID", "Duration cannot be negative.");

            if (dto.TotalMarks <= 0)
                throw new ApiException("TEST_TOTAL_MARKS_INVALID", "Total marks must be greater than zero.");

            var closingAt = NormalizeClosingAt(dto.ClosingAt);

            var test = await _db.Tests.FirstOrDefaultAsync(t =>
                t.Id == testId &&
                t.AdminId == adminId &&
                !t.IsDeleted);

            if (test == null)
                throw new KeyNotFoundException("Test not found.");

            var isGlobal = dto.IsGlobal ?? false;
            int? classId = null;

            if (!isGlobal)
            {
                classId = dto.ClassId;
                if (classId.HasValue)
                {
                    await _classService.ValidateClassOwnershipAsync(adminId.Value, classId.Value);
                }
                else
                {
                    classId = await _classService.GetOrCreateDefaultClassIdAsync(adminId.Value);
                }
            }

            test.Name = dto.Name.Trim();
            test.Description = dto.Description?.Trim() ?? string.Empty;
            test.TestImageUrl = NormalizeTestImageUrl(dto.TestImageUrl);
            test.ClosingAt = closingAt;
            test.Duration = dto.Duration;
            test.TotalMarks = dto.TotalMarks;
            test.IsGlobal = isGlobal;
            test.ClassId = isGlobal ? null : classId;

            await ApplyTestInstructionsAsync(adminId.Value, test.Id, dto.InstructionIds);
            await _db.SaveChangesAsync();

            var className = test.ClassId.HasValue
                ? await _db.Classes.Where(c => c.Id == test.ClassId.Value).Select(c => c.Name).FirstOrDefaultAsync()
                : null;

            var questionCount = await _db.TestQuestions.CountAsync(tq => tq.TestId == test.Id);
            var instructions = await _db.TestInstructions
                .AsNoTracking()
                .Where(ti => ti.TestId == test.Id)
                .OrderBy(ti => ti.OrderIndex)
                .Select(ti => new TestInstructionDto(ti.InstructionId, ti.Instruction.Text, ti.OrderIndex))
                .ToListAsync();

            return new AdminTestDto(
                test.Id,
                test.Name,
                test.Description,
                test.Duration,
                test.TotalMarks,
                questionCount,
                test.IsActive,
                test.CreatedAt,
                test.IsGlobal,
                test.ClassId,
                className,
                test.TestImageUrl,
                test.ClosingAt,
                instructions
            );
        }

        private async Task ApplyTestInstructionsAsync(int adminId, int testId, List<int>? instructionIds)
        {
            var normalized = (instructionIds ?? new List<int>())
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            var existing = await _db.TestInstructions
                .Where(ti => ti.TestId == testId)
                .ToListAsync();

            _db.TestInstructions.RemoveRange(existing);

            if (normalized.Count == 0)
                return;

            var validIds = await _db.Instructions
                .AsNoTracking()
                .Where(i => !i.IsDeleted && i.IsActive && i.AdminId == adminId && normalized.Contains(i.Id))
                .Select(i => i.Id)
                .ToListAsync();

            if (validIds.Count != normalized.Count)
                throw new ApiException("TEST_INSTRUCTION_INVALID", "One or more selected instructions are invalid.");

            var links = normalized
                .Select((instructionId, index) => new TestInstruction
                {
                    TestId = testId,
                    InstructionId = instructionId,
                    OrderIndex = index + 1
                })
                .ToList();

            _db.TestInstructions.AddRange(links);
        }

        private static DateTime NormalizeClosingAt(DateTime? input)
        {
            if (!input.HasValue)
                throw new ApiException("TEST_CLOSING_DATE_REQUIRED", "Closing date is required.");

            var value = input.Value.Kind switch
            {
                DateTimeKind.Utc => input.Value,
                DateTimeKind.Local => input.Value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(input.Value, DateTimeKind.Local).ToUniversalTime()
            };

            if (value <= DateTime.UtcNow)
                throw new ApiException("TEST_CLOSING_DATE_INVALID", "Closing date must be in the future.");

            return value;
        }

        private static string? NormalizeTestImageUrl(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;
            var value = input.Trim();

            if (value.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                return value;

            if (Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
                (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            {
                return value;
            }

            throw new ApiException("TEST_IMAGE_INVALID", "Test image must be a valid image data URL or an absolute HTTP/HTTPS URL.");
        }

        public Task RemoveQuestionFromTestAsync(int testId, int questionId) => RemoveQuestionFromTestAsync(null, testId, questionId);

        public async Task RemoveQuestionFromTestAsync(int? adminId, int testId, int questionId)
        {
            if (adminId != null)
            {
                var testExists = await _db.Tests.AnyAsync(t => t.Id == testId && t.AdminId == adminId && !t.IsDeleted);
                if (!testExists) throw new KeyNotFoundException("Test not found.");
            }
            var tq = await _db.TestQuestions.FirstOrDefaultAsync(x => x.TestId == testId && x.QuestionId == questionId);
            if (tq != null)
            {
                _db.TestQuestions.Remove(tq);
                await _db.SaveChangesAsync();
            }
        }

        public Task<List<Question>> GetTestQuestionsAsync(int testId) => GetTestQuestionsAsync(null, testId);

        public async Task<List<Question>> GetTestQuestionsAsync(int? adminId, int testId)
        {
            if (adminId != null)
            {
                var testExists = await _db.Tests.AnyAsync(t => t.Id == testId && t.AdminId == adminId && !t.IsDeleted);
                if (!testExists) throw new KeyNotFoundException("Test not found.");
            }
            return await _db.TestQuestions
                .Where(tq => tq.TestId == testId)
                .OrderBy(tq => tq.OrderIndex)
                .Select(tq => tq.Question)
                .ToListAsync();
        }

        public Task AssignQuestionsAsync(AssignQuestionsDto dto) => AssignQuestionsAsync(null, dto);

        public async Task AssignQuestionsAsync(int? adminId, AssignQuestionsDto dto)
        {
            var test = await _db.Tests.FirstOrDefaultAsync(t => t.Id == dto.TestId && (adminId == null || t.AdminId == adminId))
                ?? throw new KeyNotFoundException($"Test {dto.TestId} not found.");

            if (adminId != null)
            {
                var invalidQuestionIds = await _db.Questions
                    .Where(q => dto.QuestionIds.Contains(q.Id) && q.AdminId != adminId)
                    .Select(q => q.Id)
                    .ToListAsync();

                if (invalidQuestionIds.Count > 0)
                    throw new InvalidOperationException("One or more questions do not belong to this admin.");
            }

            // Remove existing assignments
            var existing = _db.TestQuestions.Where(tq => tq.TestId == dto.TestId);
            _db.TestQuestions.RemoveRange(existing);

            // Assign new questions with order
            var assignments = dto.QuestionIds.Select((qId, index) => new TestQuestion
            {
                TestId = dto.TestId,
                QuestionId = qId,
                OrderIndex = index + 1
            });

            await _db.TestQuestions.AddRangeAsync(assignments);
            await _db.SaveChangesAsync();
        }

        // ── Results ────────────────────────────────────────────────────────────

        public Task<List<ResultDto>> GetAllResultsAsync() => GetAllResultsAsync(null);

        public async Task<List<ResultDto>> GetAllResultsAsync(int? adminId)
        {
            var query = _db.Results
                .Include(r => r.User)
                .Include(r => r.Test)
                .AsQueryable();
            if (adminId != null) query = query.Where(r => r.Test.AdminId == adminId || r.User.AdminId == adminId);

            return await query
                .OrderByDescending(r => r.SubmittedAt)
                .Select(r => new ResultDto(
                    r.UserId,
                    r.User.Name,
                    r.TestId,
                    r.Test.Name,
                    r.Score,
                    r.TotalQuestions,
                    r.SubmittedAt,
                    r.IsPublished,
                    r.PublishedAt
                ))
                .ToListAsync();
        }

        public async Task ReleaseResultAsync(int adminId, int userId, int testId)
        {
            var result = await _db.Results
                .Include(r => r.Test)
                .FirstOrDefaultAsync(r => r.UserId == userId && r.TestId == testId);

            if (result == null)
                throw new KeyNotFoundException("Result not found.");

            if (result.Test.AdminId != adminId)
                throw new UnauthorizedAccessException("You are not allowed to release this result.");

            if (result.IsPublished)
                return;

            result.IsPublished = true;
            result.PublishedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        public async Task<AdminAnswerReviewDto> GetAnswerReviewAsync(int adminId, int userId, int testId)
        {
            var result = await _db.Results
                .AsNoTracking()
                .Include(r => r.User)
                .Include(r => r.Test)
                .FirstOrDefaultAsync(r => r.UserId == userId && r.TestId == testId && r.Test.AdminId == adminId);

            if (result == null) throw new KeyNotFoundException("Result not found.");

            // Fetch answers from StudentAnswers via the TestAttempt (new Attempt system)
            var attempt = await _db.TestAttempts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.UserId == userId && a.TestId == testId && a.IsSubmitted);

            Dictionary<int, int> answers = new();
            
            if (attempt != null)
            {
                answers = await _db.StudentAnswers
                    .AsNoTracking()
                    .Where(a => a.AttemptId == attempt.Id)
                    .ToDictionaryAsync(a => a.QuestionId, a => a.SelectedOption);
            }
            else
            {
                // Fallback to UserAnswers for direct submission system (legacy)
                answers = await _db.UserAnswers
                    .AsNoTracking()
                    .Where(a => a.UserId == userId && a.TestId == testId)
                    .ToDictionaryAsync(a => a.QuestionId, a => a.SelectedOption);
            }

            var items = await _db.TestQuestions
                .AsNoTracking()
                .Where(tq => tq.TestId == testId)
                .OrderBy(tq => tq.OrderIndex)
                .Select(tq => new { tq.OrderIndex, Question = tq.Question })
                .Select(x => new AdminAnswerReviewItemDto(
                    x.Question.Id,
                    x.OrderIndex,
                    x.Question.Question_EN,
                    x.Question.Option1_EN,
                    x.Question.Option2_EN,
                    x.Question.Option3_EN,
                    x.Question.Option4_EN,
                    x.Question.CorrectOption,
                    answers.ContainsKey(x.Question.Id) ? answers[x.Question.Id] : 0,
                    answers.ContainsKey(x.Question.Id) && answers[x.Question.Id] == x.Question.CorrectOption
                ))
                .ToListAsync();

            return new AdminAnswerReviewDto(
                result.UserId,
                result.User.Name,
                result.TestId,
                result.Test.Name,
                result.SubmittedAt,
                result.Score,
                result.TotalQuestions,
                items
            );
        }

        // ── Excel/CSV Import ──────────────────────────────────────────────────
        public Task<ImportSummaryDto> ImportQuestionsAsync(IFormFile file) => throw new NotSupportedException("Manual question import requires the staged import endpoints.");

        public Task<ImportSummaryDto> ImportQuestionsAsync(int? adminId, IFormFile file) => throw new NotSupportedException("Manual question import requires the staged import endpoints.");

        public async Task<QuestionImportInitResponseDto> InitializeQuestionImportAsync(int? adminId, IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileBytes = await ReadFileBytesAsync(file);
            var parsed = ParseQuestionImportFile(fileBytes, extension);
            var sessionId = Guid.NewGuid().ToString("N");

            var state = new QuestionImportSessionState
            {
                SessionId = sessionId,
                AdminId = adminId,
                FileName = file.FileName,
                FileType = extension,
                Headers = parsed.Headers,
                Rows = parsed.Rows,
                TotalRows = parsed.Rows.Count,
                CreatedAtUtc = DateTime.UtcNow
            };

            _cache.Set(GetQuestionImportCacheKey(adminId, sessionId), state, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });

            return new QuestionImportInitResponseDto(
                sessionId,
                file.FileName,
                extension.TrimStart('.'),
                parsed.Rows.Count,
                parsed.Headers);
        }

        public Task<QuestionImportPreviewResponseDto> PreviewQuestionImportAsync(int? adminId, QuestionImportPreviewRequestDto request)
        {
            var state = GetQuestionImportSession(adminId, request.SessionId);
            return Task.FromResult(BuildQuestionImportPreview(state, request.Mapping, request.SkipInvalidRows));
        }

        public async Task<ImportSummaryDto> ConfirmQuestionImportAsync(int? adminId, QuestionImportConfirmRequestDto request)
        {
            var state = GetQuestionImportSession(adminId, request.SessionId);
            var parsedRows = BuildQuestionImportRows(state, request.Mapping);
            var summary = new ImportSummaryDto
            {
                TotalRows = state.TotalRows,
                FailedCount = parsedRows.Count(row => !row.IsValid)
            };

            var validRows = parsedRows.Where(row => row.IsValid).ToList();
            if (!request.SkipInvalidRows && parsedRows.Any(row => !row.IsValid))
            {
                summary.Errors = parsedRows.Where(row => !row.IsValid)
                    .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                    .ToList();
                return summary;
            }

            if (!validRows.Any())
            {
                summary.SkippedCount = parsedRows.Count(row => !row.IsValid);
                summary.Errors = parsedRows.Where(row => !row.IsValid)
                    .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                    .ToList();
                return summary;
            }

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var questionsToInsert = validRows
                    .Select(row => row.Question)
                    .Where(question => question != null)
                    .ToList();

                if (questionsToInsert.Any())
                {
                    await _db.Questions.AddRangeAsync(questionsToInsert!);
                    await _db.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                summary.SuccessCount = questionsToInsert.Count;
                summary.SkippedCount = parsedRows.Count(row => !row.IsValid);
                summary.Errors = parsedRows.Where(row => !row.IsValid)
                    .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                    .ToList();
                _cache.Remove(GetQuestionImportCacheKey(adminId, request.SessionId));
                return summary;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private QuestionImportPreviewResponseDto BuildQuestionImportPreview(QuestionImportSessionState state, QuestionImportMappingDto mapping, bool skipInvalidRows)
        {
            var parsedRows = BuildQuestionImportRows(state, mapping);
            var rows = parsedRows
                .Select(row => new QuestionImportRowPreviewDto(row.RowNumber, row.Values, row.IsValid, row.Errors))
                .ToList();

            var errors = parsedRows
                .Where(row => !row.IsValid)
                .SelectMany(row => row.Errors.Select(error => $"Row {row.RowNumber}: {error}"))
                .Take(25)
                .ToList();

            return new QuestionImportPreviewResponseDto(
                state.SessionId,
                state.TotalRows,
                parsedRows.Count(row => row.IsValid),
                parsedRows.Count(row => !row.IsValid),
                rows,
                errors);
        }

        private List<QuestionImportParsedRow> BuildQuestionImportRows(QuestionImportSessionState state, QuestionImportMappingDto mapping)
        {
            var mappingErrors = ValidateQuestionImportMapping(state, mapping);
            if (mappingErrors.Any())
            {
                return new List<QuestionImportParsedRow>
                {
                    new QuestionImportParsedRow(
                        0,
                        new Dictionary<string, string>(),
                        mappingErrors,
                        null)
                };
            }

            var rows = new List<QuestionImportParsedRow>();
            for (int i = 0; i < state.Rows.Count; i++)
            {
                var rowNumber = i + 2;
                var rowValues = state.Rows[i];
                rows.Add(MapQuestionImportRow(rowNumber, rowValues, mapping, state.FileName, state.AdminId));
            }

            return rows;
        }

        private List<string> ValidateQuestionImportMapping(QuestionImportSessionState state, QuestionImportMappingDto mapping)
        {
            var errors = new List<string>();
            var headerCount = state.Headers.Count;
            var selectedColumns = new Dictionary<int, string>();

            void ValidateColumn(string fieldName, int? columnIndex, bool required)
            {
                if (!columnIndex.HasValue)
                {
                    if (required)
                    {
                        errors.Add($"{fieldName} is required.");
                    }

                    return;
                }

                if (columnIndex.Value < 1 || columnIndex.Value > headerCount)
                {
                    errors.Add($"{fieldName} column is out of range.");
                    return;
                }

                if (selectedColumns.TryGetValue(columnIndex.Value, out var existingField))
                {
                    errors.Add($"Column '{state.Headers[columnIndex.Value - 1].Header}' is mapped to both {existingField} and {fieldName}.");
                    return;
                }

                selectedColumns[columnIndex.Value] = fieldName;
            }

            ValidateColumn("Question", mapping.Question, true);
            ValidateColumn("Option A", mapping.OptionA, true);
            ValidateColumn("Option B", mapping.OptionB, true);
            ValidateColumn("Option C", mapping.OptionC, false);
            ValidateColumn("Option D", mapping.OptionD, false);
            ValidateColumn("Correct Answer", mapping.CorrectAnswer, true);
            ValidateColumn("Q_no", mapping.QNo, false);

            return errors;
        }

        private QuestionImportParsedRow MapQuestionImportRow(int rowNumber, IReadOnlyList<string> rowValues, QuestionImportMappingDto mapping, string fileName, int? adminId)
        {
            string GetValue(int? columnIndex)
            {
                if (!columnIndex.HasValue || columnIndex.Value < 1) return string.Empty;
                var zeroBased = columnIndex.Value - 1;
                if (zeroBased >= rowValues.Count) return string.Empty;
                return rowValues[zeroBased]?.Trim() ?? string.Empty;
            }

            var qNo = GetValue(mapping.QNo);
            var question = GetValue(mapping.Question);
            var optionA = GetValue(mapping.OptionA);
            var optionB = GetValue(mapping.OptionB);
            var optionC = GetValue(mapping.OptionC);
            var optionD = GetValue(mapping.OptionD);
            var correctAnswer = GetValue(mapping.CorrectAnswer);

            var values = new Dictionary<string, string>
            {
                ["Q_no"] = qNo,
                ["Question"] = question,
                ["Option A"] = optionA,
                ["Option B"] = optionB,
                ["Option C"] = optionC,
                ["Option D"] = optionD,
                ["Correct Answer"] = correctAnswer
            };

            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(question)) errors.Add("Missing Question.");
            if (string.IsNullOrWhiteSpace(optionA)) errors.Add("Missing Option A.");
            if (string.IsNullOrWhiteSpace(optionB)) errors.Add("Missing Option B.");
            if (string.IsNullOrWhiteSpace(correctAnswer)) errors.Add("Missing Correct Answer.");

            var correctOption = ResolveCorrectOption(correctAnswer, optionA, optionB, optionC, optionD);
            if (correctOption == 0)
            {
                errors.Add("Invalid Correct Answer. Use A/B/C/D or match one option value.");
            }

            Question? mappedQuestion = null;
            if (!errors.Any())
            {
                mappedQuestion = new Question
                {
                    Question_EN = question,
                    Option1_EN = optionA,
                    Option2_EN = optionB,
                    Option3_EN = optionC,
                    Option4_EN = optionD,
                    CorrectOption = correctOption,
                    SourceFileName = fileName,
                    AdminId = adminId
                };
            }

            return new QuestionImportParsedRow(rowNumber, values, errors, mappedQuestion);
        }

        private static int ResolveCorrectOption(string correctAnswer, string optionA, string optionB, string optionC, string optionD)
        {
            if (string.IsNullOrWhiteSpace(correctAnswer)) return 0;

            var normalized = correctAnswer.Trim().ToUpperInvariant();
            if (normalized.Length == 1)
            {
                return normalized switch
                {
                    "A" => 1,
                    "B" => 2,
                    "C" => 3,
                    "D" => 4,
                    _ => 0
                };
            }

            if (string.Equals(correctAnswer.Trim(), optionA, StringComparison.OrdinalIgnoreCase)) return 1;
            if (string.Equals(correctAnswer.Trim(), optionB, StringComparison.OrdinalIgnoreCase)) return 2;
            if (string.Equals(correctAnswer.Trim(), optionC, StringComparison.OrdinalIgnoreCase)) return 3;
            if (string.Equals(correctAnswer.Trim(), optionD, StringComparison.OrdinalIgnoreCase)) return 4;

            return 0;
        }

        private static QuestionImportFileData ParseQuestionImportFile(byte[] fileBytes, string extension)
        {
            if (extension == ".xlsx")
            {
                using var stream = new MemoryStream(fileBytes);
                using var package = new ExcelPackage(stream);
                var worksheet = package.Workbook.Worksheets.FirstOrDefault();

                if (worksheet?.Dimension == null)
                    throw new InvalidOperationException("The Excel file does not contain any rows.");

                var rowCount = worksheet.Dimension.Rows;
                var columnCount = worksheet.Dimension.Columns;
                var headers = Enumerable.Range(1, columnCount)
                    .Select(col => new QuestionImportHeaderDto(col, worksheet.Cells[1, col].Text ?? string.Empty))
                    .ToList();

                var rows = new List<List<string>>();
                for (int row = 2; row <= rowCount; row++)
                {
                    var values = Enumerable.Range(1, columnCount)
                        .Select(col => worksheet.Cells[row, col].Text ?? string.Empty)
                        .ToList();

                    if (values.Any(value => !string.IsNullOrWhiteSpace(value)))
                    {
                        rows.Add(values);
                    }
                }

                return new QuestionImportFileData(headers, rows);
            }

            if (extension == ".csv")
            {
                var content = Encoding.UTF8.GetString(fileBytes);
                var lines = content.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
                if (lines.Length == 0 || string.IsNullOrWhiteSpace(lines[0]))
                    throw new InvalidOperationException("The CSV file does not contain a header row.");

                var headerValues = ParseCsvLine(lines[0]);
                if (headerValues.Count > 0)
                {
                    headerValues[0] = headerValues[0].TrimStart('\uFEFF');
                }

                var headers = headerValues
                    .Select((header, index) => new QuestionImportHeaderDto(index + 1, header))
                    .ToList();

                var rows = new List<List<string>>();
                for (int i = 1; i < lines.Length; i++)
                {
                    if (string.IsNullOrWhiteSpace(lines[i])) continue;
                    var values = ParseCsvLine(lines[i]);
                    if (values.Any(value => !string.IsNullOrWhiteSpace(value)))
                    {
                        rows.Add(values);
                    }
                }

                return new QuestionImportFileData(headers, rows);
            }

            throw new InvalidOperationException("Only .xlsx and .csv files are supported.");
        }

        private async Task<byte[]> ReadFileBytesAsync(IFormFile file)
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            return stream.ToArray();
        }

        private string GetQuestionImportCacheKey(int? adminId, string sessionId) => $"question-import:{adminId ?? 0}:{sessionId}";

        private QuestionImportSessionState GetQuestionImportSession(int? adminId, string sessionId)
        {
            if (_cache.TryGetValue(GetQuestionImportCacheKey(adminId, sessionId), out object? cached) && cached is QuestionImportSessionState state)
            {
                return state;
            }

            throw new KeyNotFoundException("Question import session expired. Please upload the file again.");
        }

        private sealed record QuestionImportFileData(List<QuestionImportHeaderDto> Headers, List<List<string>> Rows);

        private sealed record QuestionImportParsedRow(int RowNumber, Dictionary<string, string> Values, List<string> Errors, Question? Question)
        {
            public bool IsValid => Errors.Count == 0 && Question != null;
        }

        private sealed class QuestionImportSessionState
        {
            public string SessionId { get; set; } = string.Empty;
            public int? AdminId { get; set; }
            public string FileName { get; set; } = string.Empty;
            public string FileType { get; set; } = string.Empty;
            public List<QuestionImportHeaderDto> Headers { get; set; } = new();
            public List<List<string>> Rows { get; set; } = new();
            public int TotalRows { get; set; }
            public DateTime CreatedAtUtc { get; set; }
        }

        // ── Delete Question ───────────────────────────────────────────────────
        public Task DeleteQuestionAsync(int id) => DeleteQuestionAsync(null, id);

        public async Task DeleteQuestionAsync(int? adminId, int id)
        {
            var question = await _db.Questions
                .Include(q => q.TestQuestions)
                .Include(q => q.UserAnswers)
                .FirstOrDefaultAsync(q => q.Id == id && (adminId == null || q.AdminId == adminId));

            if (question == null) throw new KeyNotFoundException("Question not found.");

            // Remove associated links and answers first (Cascade delete manual)
            _db.TestQuestions.RemoveRange(question.TestQuestions);
            _db.UserAnswers.RemoveRange(question.UserAnswers);
            _db.Questions.Remove(question);

            await _db.SaveChangesAsync();
        }

        public Task DeleteBulkQuestionsAsync(List<int> ids) => DeleteBulkQuestionsAsync(null, ids);

        public async Task DeleteBulkQuestionsAsync(int? adminId, List<int> ids)
        {
            var questions = await _db.Questions
                .Include(q => q.TestQuestions)
                .Include(q => q.UserAnswers)
                .Where(q => ids.Contains(q.Id) && (adminId == null || q.AdminId == adminId))
                .ToListAsync();

            if (!questions.Any()) return;

            _db.TestQuestions.RemoveRange(questions.SelectMany(q => q.TestQuestions));
            _db.UserAnswers.RemoveRange(questions.SelectMany(q => q.UserAnswers));
            _db.Questions.RemoveRange(questions);

            await _db.SaveChangesAsync();
        }
    }
}
