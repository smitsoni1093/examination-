using System.ComponentModel.DataAnnotations.Schema;

namespace ExamAPI.Models
{
    public class Instruction
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? AdminId { get; set; }

        [ForeignKey("AdminId")]
        public User? Admin { get; set; }

        public ICollection<TestInstruction> TestInstructions { get; set; } = new List<TestInstruction>();
    }
}
