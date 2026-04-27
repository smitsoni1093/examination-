namespace ExamAPI.Services
{
    public class ApiException : Exception
    {
        public string MessageKey { get; set; }
        public object[]? Args { get; set; }

        public ApiException(string messageKey, string message, object[]? args = null) 
            : base(message)
        {
            MessageKey = messageKey;
            Args = args;
        }
    }
}
