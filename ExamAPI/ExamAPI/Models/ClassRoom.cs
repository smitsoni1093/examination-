using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExamAPI.Models
{
    [Table("Classes")]
    public class ClassRoom
    {
        public int Id { get; set; }

        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public int AdminId { get; set; }

        [ForeignKey("AdminId")]
        public User? Admin { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Test> Tests { get; set; } = new List<Test>();
    }
}
