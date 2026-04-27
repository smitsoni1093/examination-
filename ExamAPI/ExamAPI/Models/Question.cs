using System.ComponentModel.DataAnnotations.Schema;

namespace ExamAPI.Models
{
    /// <summary>
    /// Multi-language MCQ Question with 4 options per language.
    /// CorrectOption: 1-4
    /// </summary>
    public class Question
    {
        public int Id { get; set; }

        // English
        public string Question_EN { get; set; } = string.Empty;
        public string Option1_EN { get; set; } = string.Empty;
        public string Option2_EN { get; set; } = string.Empty;
        public string Option3_EN { get; set; } = string.Empty;
        public string Option4_EN { get; set; } = string.Empty;

        // Hindi
        public string Question_HI { get; set; } = string.Empty;
        public string Option1_HI { get; set; } = string.Empty;
        public string Option2_HI { get; set; } = string.Empty;
        public string Option3_HI { get; set; } = string.Empty;
        public string Option4_HI { get; set; } = string.Empty;

        // Gujarati
        public string Question_GU { get; set; } = string.Empty;
        public string Option1_GU { get; set; } = string.Empty;
        public string Option2_GU { get; set; } = string.Empty;
        public string Option3_GU { get; set; } = string.Empty;
        public string Option4_GU { get; set; } = string.Empty;

        /// <summary>Correct option index: 1, 2, 3, or 4</summary>
        public int CorrectOption { get; set; }

        public string SourceFileName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // FK to Admin (who imported/created this question); nullable for backward compatibility
        public int? AdminId { get; set; }

        [ForeignKey("AdminId")]
        public User? Admin { get; set; }

        // Navigation
        public ICollection<TestQuestion> TestQuestions { get; set; } = new List<TestQuestion>();
        public ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
    }
}
