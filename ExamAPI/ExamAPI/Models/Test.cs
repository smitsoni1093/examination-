namespace ExamAPI.Models
{
    public class Test
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        /// <summary>Duration in minutes</summary>
        public int Duration { get; set; }

        // Navigation
        public ICollection<TestQuestion> TestQuestions { get; set; } = new List<TestQuestion>();
        public ICollection<Result> Results { get; set; } = new List<Result>();
    }
}
