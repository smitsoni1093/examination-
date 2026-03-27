using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Test> Tests { get; set; }
        public DbSet<TestQuestion> TestQuestions { get; set; }
        public DbSet<UserAnswer> UserAnswers { get; set; }
        public DbSet<Result> Results { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Composite primary key for TestQuestion join table
            modelBuilder.Entity<TestQuestion>()
                .HasKey(tq => new { tq.TestId, tq.QuestionId });

            // Unique constraint: one result per user per test
            modelBuilder.Entity<Result>()
                .HasIndex(r => new { r.UserId, r.TestId })
                .IsUnique();

            // Unique constraint: one answer per user per question per test
            modelBuilder.Entity<UserAnswer>()
                .HasIndex(ua => new { ua.UserId, ua.TestId, ua.QuestionId })
                .IsUnique();

            // Seed default Admin user (password: Admin@123)
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Name = "System Admin",
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin"
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
