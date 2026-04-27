using System.ComponentModel.DataAnnotations;

namespace ExamAPI.Models
{
    public class UserOtp
    {
        public int Id { get; set; }

        [StringLength(20)]
        public string MobileNumber { get; set; } = string.Empty;

        [StringLength(128)]
        public string OTPCode { get; set; } = string.Empty;

        public DateTime ExpiryTime { get; set; }

        public bool IsUsed { get; set; } = false;

        public int AttemptCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
