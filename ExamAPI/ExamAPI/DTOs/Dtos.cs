namespace ExamAPI.DTOs
{
    // ──────────────────────────────────── API RESPONSES ────────────────────────────────────
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? MessageKey { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
    }

    public class ApiResponse
    {
        public bool Success { get; set; }
        public string? MessageKey { get; set; }
        public string? Message { get; set; }
    }

    public record UpdatePreferencesDto(string PreferredLanguage);

    // Auth
    public record LoginRequest(string Username, string Password);
    public record LoginResponse(string Token, string Role, string Name, int UserId, int? AdminId = null);
    public record LookupMobileRequest(string MobileNumber);
    public record SendOtpRequest(string MobileNumber);
    public record VerifyOtpRequest(string MobileNumber, string Otp);
    public record SendOtpResponseDto(string MobileNumberMasked, int ExpiresInSeconds, int ResendAfterSeconds);
    public record OtpAccountOptionDto(
        int UserId,
        string Name,
        string Username,
        string Role,
        string Email,
        string? MobileNumber,
        string? RollNumber,
        string? ClassName,
        string? Address,
        string? Pincode
    );
    public record VerifyOtpResultDto(
        bool RequiresAccountSelection,
        LoginResponse? Login,
        string? SelectionToken,
        List<OtpAccountOptionDto>? Accounts
    );
    public record CompleteOtpSelectionRequest(string SelectionToken, int UserId);

    // Admin
    public record CreateUserDto(string Name, string Username, string Password, int? ClassId = null);
    public record CreateInvitedUserDto(string FullName, string Email, string? MobileNumber, string? Pincode = null, string? Address = null, int? ClassId = null);
    public record CreateUserResponseDto(int UserId, string FullName, string Email, string Username, string MobileNumber, string RollNumber, string? Pincode, string? Address, int? ClassId);
    public record UpdateInvitedUserDto(string FullName, string Email, string? MobileNumber, string? Pincode = null, string? Address = null, int? ClassId = null);
    public record CreateQuestionDto(
        string Question_EN, string Option1_EN, string Option2_EN, string Option3_EN, string Option4_EN,
        string Question_HI, string Option1_HI, string Option2_HI, string Option3_HI, string Option4_HI,
        string Question_GU, string Option1_GU, string Option2_GU, string Option3_GU, string Option4_GU,
        int CorrectOption
    );
    public record CreateTestDto(string Name, string? Description, int Duration, int TotalMarks, int? ClassId = null, bool? IsGlobal = null, string? TestImageUrl = null, DateTime? ClosingAt = null, List<int>? InstructionIds = null);
    public record UpdateTestDto(string Name, string? Description, int Duration, int TotalMarks, int? ClassId = null, bool? IsGlobal = null, string? TestImageUrl = null, DateTime? ClosingAt = null, List<int>? InstructionIds = null);
    public record AssignQuestionsDto(int TestId, List<int> QuestionIds);
    public record CreateInstructionDto(string Text, bool IsActive = true);
    public record UpdateInstructionDto(string Text, bool IsActive);
    public record InstructionDto(int Id, string Text, bool IsActive, DateTime CreatedAt);
    public record TestInstructionDto(int Id, string Text, int OrderIndex);

    // User
    public record SubmitAnswerDto(int TestId, int QuestionId, int SelectedOption);
    public record SubmitTestDto(int TestId);
    public record SetPasswordRequest(string Token, string Password);
    public record ValidateInviteRequest(string Token);
    public record UserTestStatusDto(
        int Id,
        string Name,
        string? Description,
        int Duration,
        int QuestionCount,
        bool IsCompleted,
        int? Score,
        bool IsSubmitted = false,
        bool IsResultPublished = false,
        bool HasInProgressAttempt = false,
        int AnsweredCount = 0,
        string? TestImageUrl = null,
        DateTime? ClosingAt = null
    );

    public record UserProfileDto(
        int Id,
        string Name,
        string Username,
        string Email,
        string? MobileNumber,
        string? RollNumber,
        string? Pincode,
        string? Address,
        string Role,
        bool IsActive,
        bool IsEmailVerified,
        string PreferredLanguage,
        DateTime CreatedAt,
        int? ClassId,
        string? ClassName,
        int? AdminId,
        string? AdminName
    );

    public record AdminTestDto(
        int Id,
        string Name,
        string Description,
        int Duration,
        int TotalMarks,
        int QuestionCount,
        bool IsActive,
        DateTime CreatedAt,
        bool IsGlobal,
        int? ClassId,
        string? ClassName,
        string? TestImageUrl = null,
        DateTime? ClosingAt = null,
        List<TestInstructionDto>? Instructions = null
    );

    // Attempts
    public record StartAttemptResponseDto(int AttemptId, string Status, DateTime StartTime, DateTime LastSavedTime, int? LastQuestionIndex);
    public record AttemptDto(
        int AttemptId,
        int TestId,
        string TestName,
        int Duration,
        List<QuestionDto> Questions,
        Dictionary<int, int> SavedAnswers,
        int? LastQuestionIndex,
        DateTime LastSavedTime,
        string Status,
        string? TestImageUrl = null,
        DateTime? ClosingAt = null,
        List<TestInstructionDto>? Instructions = null
    );

    public record SaveAttemptAnswerDto(int QuestionId, int SelectedOption, int? LastQuestionIndex);

    public class ImportSummaryDto
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public int SkippedCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }

    public class UserImportSummaryDto
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }

    public record UserImportHeaderDto(int Index, string Header);

    public record UserImportInitResponseDto(
        string SessionId,
        string FileName,
        string FileType,
        int TotalRows,
        List<UserImportHeaderDto> Headers
    );

    public record UserImportMappingDto(
        int? FullName,
        int? Email,
        int? MobileNumber,
        int? Pincode,
        int? Address,
        int? Class
    );

    public record UserImportPreviewRequestDto(
        string SessionId,
        UserImportMappingDto Mapping,
        bool SkipInvalidRows
    );

    public record UserImportConfirmRequestDto(
        string SessionId,
        UserImportMappingDto Mapping,
        bool SkipInvalidRows
    );

    public record UserImportRowPreviewDto(
        int RowNumber,
        Dictionary<string, string> Values,
        bool IsValid,
        List<string> Errors
    );

    public record UserImportPreviewResponseDto(
        string SessionId,
        int TotalRows,
        int ValidRows,
        int InvalidRows,
        List<UserImportRowPreviewDto> Rows,
        List<string> Errors
    );

    public record QuestionSourceFileDto(
        string SourceFileName,
        int TotalQuestions,
        int UsedQuestions,
        bool CanSoftDelete,
        DateTime LastImportedAt
    );

    public record QuestionImportHeaderDto(int Index, string Header);

    public record QuestionImportInitResponseDto(
        string SessionId,
        string FileName,
        string FileType,
        int TotalRows,
        List<QuestionImportHeaderDto> Headers
    );

    public record QuestionImportMappingDto(
        int? QNo,
        int? Question,
        int? OptionA,
        int? OptionB,
        int? OptionC,
        int? OptionD,
        int? CorrectAnswer
    );

    public record QuestionImportPreviewRequestDto(
        string SessionId,
        QuestionImportMappingDto Mapping,
        bool SkipInvalidRows
    );

    public record QuestionImportConfirmRequestDto(
        string SessionId,
        QuestionImportMappingDto Mapping,
        bool SkipInvalidRows
    );

    public record QuestionImportRowPreviewDto(
        int RowNumber,
        Dictionary<string, string> Values,
        bool IsValid,
        List<string> Errors
    );

    public record QuestionImportPreviewResponseDto(
        string SessionId,
        int TotalRows,
        int ValidRows,
        int InvalidRows,
        List<QuestionImportRowPreviewDto> Rows,
        List<string> Errors
    );

    // Responses
    public record QuestionDto(
        int Id, int OrderIndex,
        string Question_EN, string Option1_EN, string Option2_EN, string Option3_EN, string Option4_EN,
        string Question_HI, string Option1_HI, string Option2_HI, string Option3_HI, string Option4_HI,
        string Question_GU, string Option1_GU, string Option2_GU, string Option3_GU, string Option4_GU
    );
    public record TestDto(int Id, string Name, string? Description, int Duration, List<QuestionDto> Questions, Dictionary<int, int> SavedAnswers, string? TestImageUrl = null, DateTime? ClosingAt = null, List<TestInstructionDto>? Instructions = null);
    public record ResultDto(
        int UserId,
        string UserName,
        int TestId,
        string TestName,
        int Score,
        int TotalQuestions,
        DateTime SubmittedAt,
        bool IsPublished = false,
        DateTime? PublishedAt = null
    );

    public record ReleaseResultDto(int UserId, int TestId);

    public record AdminAnswerReviewItemDto(
        int QuestionId,
        int OrderIndex,
        string Question_EN,
        string Option1_EN,
        string Option2_EN,
        string Option3_EN,
        string Option4_EN,
        int CorrectOption,
        int SelectedOption,
        bool IsCorrect
    );

    public record AdminAnswerReviewDto(
        int UserId,
        string UserName,
        int TestId,
        string TestName,
        DateTime SubmittedAt,
        int Score,
        int TotalQuestions,
        List<AdminAnswerReviewItemDto> Items
    );
}
