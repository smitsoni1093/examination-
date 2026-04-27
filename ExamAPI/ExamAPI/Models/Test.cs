using System.ComponentModel.DataAnnotations.Schema;

namespace ExamAPI.Models
{
    public class Test
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? TestImageUrl { get; set; }
        public DateTime? ClosingAt { get; set; }
        public int TotalMarks { get; set; }
        /// <summary>Duration in minutes</summary>
        public int Duration { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsGlobal { get; set; } = false;

        // FK to Admin (who created this test); nullable initially for migration
        public int? AdminId { get; set; }

        // FK to Class (null when IsGlobal is true)
        public int? ClassId { get; set; }

        [ForeignKey("AdminId")]
        public User? Admin { get; set; }

        [ForeignKey("ClassId")]
        public ClassRoom? Class { get; set; }

        // Navigation
        public ICollection<TestQuestion> TestQuestions { get; set; } = new List<TestQuestion>();
        public ICollection<TestInstruction> TestInstructions { get; set; } = new List<TestInstruction>();
        public ICollection<Result> Results { get; set; } = new List<Result>();
    }
}
