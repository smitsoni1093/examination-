using ExamAPI.Data;
using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Services
{
    public class ClassService
    {
        private readonly AppDbContext _db;

        public const string DefaultClassName = "Default";

        public ClassService(AppDbContext db) => _db = db;

        public async Task<int> GetOrCreateDefaultClassIdAsync(int adminId)
        {
            var existing = await _db.Classes
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.AdminId == adminId && c.Name == DefaultClassName);

            if (existing != null) return existing.Id;

            var created = new ClassRoom
            {
                AdminId = adminId,
                Name = DefaultClassName,
                CreatedAt = DateTime.UtcNow
            };

            _db.Classes.Add(created);
            await _db.SaveChangesAsync();
            return created.Id;
        }

        public async Task<List<ClassRoom>> GetClassesForAdminAsync(int adminId)
        {
            return await _db.Classes
                .AsNoTracking()
                .Where(c => c.AdminId == adminId)
                .OrderBy(c => c.Name == DefaultClassName ? 0 : 1)
                .ThenBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<ClassRoom> CreateClassAsync(int adminId, string name)
        {
            name = name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Class name is required.");

            if (await _db.Classes.AnyAsync(c => c.AdminId == adminId && c.Name == name))
                throw new InvalidOperationException("Class name already exists.");

            var created = new ClassRoom
            {
                AdminId = adminId,
                Name = name,
                CreatedAt = DateTime.UtcNow
            };

            _db.Classes.Add(created);
            await _db.SaveChangesAsync();
            return created;
        }

        public async Task DeleteClassAsync(int adminId, int classId)
        {
            var cls = await _db.Classes.FirstOrDefaultAsync(c => c.Id == classId);
            if (cls == null) throw new KeyNotFoundException("Class not found.");
            if (cls.AdminId != adminId) throw new UnauthorizedAccessException("Class does not belong to this admin.");
            if (cls.Name == DefaultClassName) throw new InvalidOperationException("Default class cannot be deleted.");

            var defaultId = await GetOrCreateDefaultClassIdAsync(adminId);

            var usersToReassign = await _db.Users
                .Where(u => u.AdminId == adminId && u.Role == "User" && u.ClassId == classId)
                .ToListAsync();

            foreach (var u in usersToReassign) u.ClassId = defaultId;

            var testsToReassign = await _db.Tests
                .Where(t => t.AdminId == adminId && !t.IsGlobal && t.ClassId == classId)
                .ToListAsync();

            foreach (var t in testsToReassign) t.ClassId = defaultId;

            _db.Classes.Remove(cls);
            await _db.SaveChangesAsync();
        }

        public async Task ValidateClassOwnershipAsync(int adminId, int classId)
        {
            var ok = await _db.Classes.AnyAsync(c => c.Id == classId && c.AdminId == adminId);
            if (!ok) throw new InvalidOperationException("Invalid class selection.");
        }
    }
}
