using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExamAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        /// <summary>Role: "SuperAdmin", "Admin", or "User"</summary>
        public string Role { get; set; } = "User";

        [StringLength(256)]
        public string Email { get; set; } = string.Empty;

        [StringLength(20)]
        public string? MobileNumber { get; set; }

        [StringLength(32)]
        public string? RollNumber { get; set; }

        [StringLength(20)]
        public string? Pincode { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = false;

        public bool IsEmailVerified { get; set; } = false;

        // FK to self-referencing Admin (for Users created by an Admin; null for SuperAdmin)
        public int? AdminId { get; set; }

        // FK to Class (each student belongs to one class; null for Admin/SuperAdmin)
        public int? ClassId { get; set; }

        // Preferred language for UI: "en", "hi", or "gu"
        [StringLength(10)]
        public string PreferredLanguage { get; set; } = "en";

        [ForeignKey("AdminId")]
        public User? Admin { get; set; }

        [ForeignKey("ClassId")]
        public ClassRoom? Class { get; set; }

        // Navigation
        public ICollection<UserAnswer> Answers { get; set; } = new List<UserAnswer>();
        public ICollection<Result> Results { get; set; } = new List<Result>();
        public ICollection<TestAttempt> TestAttempts { get; set; } = new List<TestAttempt>();
        public ICollection<User> ManagedUsers { get; set; } = new List<User>();
        public ICollection<UserInvitation> Invitations { get; set; } = new List<UserInvitation>();
        public ICollection<UserOtp> Otps { get; set; } = new List<UserOtp>();
    }
}
