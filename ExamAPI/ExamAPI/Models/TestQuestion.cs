namespace ExamAPI.Models
{
    /// <summary>Join table linking Tests and Questions (many-to-many)</summary>
    public class TestQuestion
    {
        public int Id { get; set; }

        public int TestId { get; set; }
        public Test Test { get; set; } = null!;

        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!;

        /// <summary>Display order within the test</summary>
        public int OrderIndex { get; set; }
    }
}
