using ExamAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<ClassRoom> Classes { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Instruction> Instructions { get; set; }
        public DbSet<Test> Tests { get; set; }
        public DbSet<TestQuestion> TestQuestions { get; set; }
        public DbSet<TestInstruction> TestInstructions { get; set; }
        public DbSet<UserAnswer> UserAnswers { get; set; }
        public DbSet<TestAttempt> TestAttempts { get; set; }
        public DbSet<StudentAnswer> StudentAnswers { get; set; }
        public DbSet<Result> Results { get; set; }
        public DbSet<UserInvitation> UserInvitations { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Primary key for TestQuestion join table
            modelBuilder.Entity<TestQuestion>()
                .HasKey(tq => tq.Id);

            // One active (InProgress) attempt per user per test
            modelBuilder.Entity<TestAttempt>()
                .HasIndex(a => new { a.UserId, a.TestId, a.Status })
                ;

            // One answer per attempt per question
            modelBuilder.Entity<StudentAnswer>()
                .HasIndex(a => new { a.AttemptId, a.QuestionId })
                .IsUnique();

            // Maintain uniqueness of question assignment within a test
            modelBuilder.Entity<TestQuestion>()
                .HasIndex(tq => new { tq.TestId, tq.QuestionId })
                .IsUnique();

            // Maintain uniqueness of instruction assignment within a test
            modelBuilder.Entity<TestInstruction>()
                .HasIndex(ti => new { ti.TestId, ti.InstructionId })
                .IsUnique();

            // Unique constraint: one result per user per test
            modelBuilder.Entity<Result>()
                .HasIndex(r => new { r.UserId, r.TestId })
                .IsUnique();

            // Unique constraint: one answer per user per question per test
            modelBuilder.Entity<UserAnswer>()
                .HasIndex(ua => new { ua.UserId, ua.TestId, ua.QuestionId })
                .IsUnique();

            modelBuilder.Entity<UserInvitation>()
                .HasIndex(i => i.TokenHash)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.RollNumber)
                .IsUnique()
                .HasFilter("[RollNumber] IS NOT NULL");

            modelBuilder.Entity<UserOtp>()
                .HasIndex(o => new { o.MobileNumber, o.CreatedAt });

            modelBuilder.Entity<UserInvitation>()
                .HasOne(i => i.User)
                .WithMany(u => u.Invitations)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure foreign keys to avoid cascade cycles
            modelBuilder.Entity<User>()
                .HasOne(u => u.Admin)
                .WithMany(u => u.ManagedUsers)
                .HasForeignKey(u => u.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ClassRoom>()
                .HasIndex(c => new { c.AdminId, c.Name })
                .IsUnique();

            modelBuilder.Entity<ClassRoom>()
                .HasOne(c => c.Admin)
                .WithMany()
                .HasForeignKey(c => c.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Class)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.ClassId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Test>()
                .HasOne(t => t.Admin)
                .WithMany()
                .HasForeignKey(t => t.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Test>()
                .HasOne(t => t.Class)
                .WithMany(c => c.Tests)
                .HasForeignKey(t => t.ClassId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Question>()
                .HasOne(q => q.Admin)
                .WithMany()
                .HasForeignKey(q => q.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Instruction>()
                .HasOne(i => i.Admin)
                .WithMany()
                .HasForeignKey(i => i.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed default Admin user (password: Admin@123)
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Name = "System Admin",
                Username = "admin",
                Email = "admin@example.com",
                PasswordHash = "$2a$11$1uZBiKFq1YNpvXJswa3Uoei46iT2Sn16Hhvapt.iemgAlVr6zGBHa",
                Role = "Admin",
                CreatedAt = new DateTime(2026, 4, 22, 10, 13, 22, 141, DateTimeKind.Utc).AddTicks(8139),
                IsActive = true
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
