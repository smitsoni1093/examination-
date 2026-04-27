using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExamAPI.Models
{
    public class UserInvitation
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required]
        [StringLength(128)]
        public string TokenHash { get; set; } = string.Empty;

        public DateTime ExpiryDate { get; set; }

        public bool IsUsed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UsedAt { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}
