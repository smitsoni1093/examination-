namespace ExamAPI.Models
{
    /// <summary>Stores the final calculated result for a user's test submission</summary>
    public class Result
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int TestId { get; set; }
        public Test Test { get; set; } = null!;

        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public bool IsPublished { get; set; } = false;
        public DateTime? PublishedAt { get; set; }
    }
}
