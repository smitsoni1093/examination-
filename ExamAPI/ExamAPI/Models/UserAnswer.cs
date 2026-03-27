namespace ExamAPI.Models
{
    /// <summary>Stores each candidate's answer for a specific question in a test (auto-saved)</summary>
    public class UserAnswer
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int TestId { get; set; }
        public Test Test { get; set; } = null!;

        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!;

        /// <summary>Selected option 1–4. 0 = not answered.</summary>
        public int SelectedOption { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
