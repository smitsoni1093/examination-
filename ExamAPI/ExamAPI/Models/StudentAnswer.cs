namespace ExamAPI.Models
{
    public class StudentAnswer
    {
        public int Id { get; set; }

        public int AttemptId { get; set; }
        public TestAttempt Attempt { get; set; } = null!;

        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!;

        public int SelectedOption { get; set; }
        public bool IsAnswered { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
