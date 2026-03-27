namespace ExamAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        /// <summary>Role: "Admin" or "User"</summary>
        public string Role { get; set; } = "User";

        // Navigation
        public ICollection<UserAnswer> Answers { get; set; } = new List<UserAnswer>();
        public ICollection<Result> Results { get; set; } = new List<Result>();
    }
}
