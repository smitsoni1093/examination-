namespace ExamAPI.Models
{
    public class TestAttempt
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int TestId { get; set; }
        public Test Test { get; set; } = null!;

        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime LastSavedTime { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "InProgress";
        public bool IsSubmitted { get; set; } = false;

        public int? LastQuestionIndex { get; set; }

        public ICollection<StudentAnswer> Answers { get; set; } = new List<StudentAnswer>();
    }
}
