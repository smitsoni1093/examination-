using System.Net;

namespace ExamAPI.Services
{
    public interface ISmsService
    {
        Task SendOtpAsync(string mobileNumber, string otp);
    }

    public class UrlTemplateSmsService : ISmsService
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<UrlTemplateSmsService> _logger;

        public UrlTemplateSmsService(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<UrlTemplateSmsService> logger)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task SendOtpAsync(string mobileNumber, string otp)
        {
            var enabled = bool.TryParse(_config["Sms:Enabled"], out var isEnabled) && isEnabled;
            if (!enabled)
            {
                _logger.LogInformation("SMS disabled. OTP for {Mobile}: {Otp}", mobileNumber, otp);
                return;
            }

            var urlTemplate = _config["Sms:UrlTemplate"];
            var messageTemplate = _config["Sms:MessageTemplate"] ?? "Your OTP is {otp}. Valid for 5 minutes.";

            if (string.IsNullOrWhiteSpace(urlTemplate))
                throw new InvalidOperationException("SMS URL template is not configured.");

            var message = messageTemplate
                .Replace("{otp}", otp)
                .Replace("{{Otp}}", otp)
                .Replace("{{OTP}}", otp);

            var requestUrl = urlTemplate
                .Replace("{mobile}", Uri.EscapeDataString(mobileNumber))
                .Replace("{otp}", Uri.EscapeDataString(otp))
                .Replace("{message}", Uri.EscapeDataString(message))
                .Replace("{{MobileNo}}", Uri.EscapeDataString(mobileNumber))
                .Replace("{{MobileNumber}}", Uri.EscapeDataString(mobileNumber))
                .Replace("{{Message}}", Uri.EscapeDataString(message))
                .Replace("{{Otp}}", Uri.EscapeDataString(otp))
                .Replace("{{OTP}}", Uri.EscapeDataString(otp));

            var client = _httpClientFactory.CreateClient();
            using var response = await client.GetAsync(requestUrl);
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("SMS provider request failed. Status: {Status} Body: {Body}", response.StatusCode, responseBody);
                throw new InvalidOperationException($"SMS provider returned {(int)response.StatusCode} ({response.StatusCode}).");
            }
        }
    }
}
