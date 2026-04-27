namespace ExamAPI.Models
{
    public class TestInstruction
    {
        public int Id { get; set; }

        public int TestId { get; set; }
        public Test Test { get; set; } = null!;

        public int InstructionId { get; set; }
        public Instruction Instruction { get; set; } = null!;

        public int OrderIndex { get; set; }
    }
}
