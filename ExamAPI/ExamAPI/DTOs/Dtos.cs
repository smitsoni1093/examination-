namespace ExamAPI.DTOs
{
    // Auth
    public record LoginRequest(string Username, string Password);
    public record LoginResponse(string Token, string Role, string Name, int UserId);

    // Admin
    public record CreateUserDto(string Name, string Username, string Password);
    public record CreateQuestionDto(
        string Question_EN, string Option1_EN, string Option2_EN, string Option3_EN, string Option4_EN,
        string Question_HI, string Option1_HI, string Option2_HI, string Option3_HI, string Option4_HI,
        string Question_GU, string Option1_GU, string Option2_GU, string Option3_GU, string Option4_GU,
        int CorrectOption
    );
    public record CreateTestDto(string Name, int Duration);
    public record AssignQuestionsDto(int TestId, List<int> QuestionIds);

    // User
    public record SubmitAnswerDto(int TestId, int QuestionId, int SelectedOption);
    public record SubmitTestDto(int TestId);
    public record UserTestStatusDto(int Id, string Name, int Duration, int QuestionCount, bool IsCompleted, int? Score);
    public record AdminTestDto(int Id, string Name, int Duration, int QuestionCount);

    // Responses
    public record QuestionDto(
        int Id, int OrderIndex,
        string Question_EN, string Option1_EN, string Option2_EN, string Option3_EN, string Option4_EN,
        string Question_HI, string Option1_HI, string Option2_HI, string Option3_HI, string Option4_HI,
        string Question_GU, string Option1_GU, string Option2_GU, string Option3_GU, string Option4_GU
    );
    public record TestDto(int Id, string Name, int Duration, List<QuestionDto> Questions, Dictionary<int, int> SavedAnswers);
    public record ResultDto(int UserId, string UserName, int TestId, string TestName, int Score, int TotalQuestions, DateTime SubmittedAt);
}
