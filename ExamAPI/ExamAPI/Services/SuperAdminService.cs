using ExamAPI.Data;
using ExamAPI.DTOs;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Services
{
    public class SuperAdminService
    {
        private readonly AppDbContext _db;

        public SuperAdminService(AppDbContext db) => _db = db;

        public async Task<User> CreateAdminAsync(CreateUserDto dto)
        {
            if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
                throw new InvalidOperationException($"Username '{dto.Username}' is already taken.");

            var admin = new User
            {
                Name = dto.Name,
                Username = dto.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Admin",
                IsActive = true
            };

            _db.Users.Add(admin);
            await _db.SaveChangesAsync();
            return admin;
        }

        public async Task<List<User>> GetAdminsAsync()
        {
            return await _db.Users
                .Where(u => u.Role == "Admin")
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task SetAdminActiveAsync(int adminUserId, bool isActive)
        {
            var admin = await _db.Users.FirstOrDefaultAsync(u => u.Id == adminUserId && u.Role == "Admin");
            if (admin == null) throw new KeyNotFoundException("Admin not found.");

            admin.IsActive = isActive;
            await _db.SaveChangesAsync();
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _db.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<AdminTestDto>> GetAllTestsAsync()
        {
            return await _db.Tests
                .Where(t => !t.IsDeleted)
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
                    null
                ))
                .ToListAsync();
        }

        public async Task<List<ResultDto>> GetAllResultsAsync()
        {
            return await _db.Results
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
                    r.PublishedAt))
                .ToListAsync();
        }
    }
}
