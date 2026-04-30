using ExamAPI.DTOs;
using ExamAPI.Services;
using System.Net;

namespace ExamAPI.Middleware
{
    public class GlobalExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly LocalizationService _localization;
        private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

        public GlobalExceptionHandlerMiddleware(RequestDelegate next, LocalizationService localization, ILogger<GlobalExceptionHandlerMiddleware> logger)
        {
            _next = next;
            _localization = localization;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            ApiResponse response = new();

            if (exception is ApiException apiEx)
            {
                context.Response.StatusCode = apiEx.MessageKey switch
                {
                    "MOBILE_NOT_REGISTERED" => (int)HttpStatusCode.NotFound,
                    "NOT_FOUND" => (int)HttpStatusCode.NotFound,
                    "UNAUTHORIZED" => (int)HttpStatusCode.Unauthorized,
                    "FORBIDDEN" => (int)HttpStatusCode.Forbidden,
                    _ => (int)HttpStatusCode.BadRequest
                };
                response.Success = false;
                response.MessageKey = apiEx.MessageKey;
                response.Message = apiEx.Message;
            }
            else if (exception is ArgumentException || exception is InvalidOperationException)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Success = false;
                response.MessageKey = "ERROR_INVALID_INPUT";
                response.Message = exception.Message;
            }
            else if (exception is UnauthorizedAccessException)
            {
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Success = false;
                response.MessageKey = "UNAUTHORIZED";
                response.Message = "Unauthorized access";
            }
            else if (exception is KeyNotFoundException)
            {
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Success = false;
                response.MessageKey = "NOT_FOUND";
                response.Message = exception.Message;
            }
            else
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Success = false;
                response.MessageKey = "ERROR_UNKNOWN";
                response.Message = exception.Message;
                _logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            }

            return context.Response.WriteAsJsonAsync(response);
        }
    }
}
