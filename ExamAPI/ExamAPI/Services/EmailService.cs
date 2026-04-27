using System.Net;
using System.Net.Mail;

namespace ExamAPI.Services
{
    public interface IEmailService
    {
        Task SendInviteAsync(string toEmail, string fullName, string username, string inviteLink);
    }

    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendInviteAsync(string toEmail, string fullName, string username, string inviteLink)
        {
            var host = _config["Email:SmtpHost"];
            var port = int.TryParse(_config["Email:SmtpPort"], out var smtpPort) ? smtpPort : 587;
            var smtpUsername = _config["Email:Username"];
            var password = _config["Email:Password"];
            var fromEmail = _config["Email:FromEmail"];
            var fromName = _config["Email:FromName"] ?? "Exam Platform";
            var enabled = bool.TryParse(_config["Email:Enabled"], out var isEnabled) && isEnabled;

            if (!enabled)
            {
                _logger.LogInformation("Email disabled. Invite link for {Email}: {InviteLink}", toEmail, inviteLink);
                return;
            }

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(smtpUsername) ||
                string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("Email SMTP configuration is incomplete.");
            }

            var body = $@"Hello {fullName},

You have been invited to join the system.
You can sign in using your email ({toEmail}) or username ({username}) after setting your password.
Click the link below to set your password:

{inviteLink}

This link will expire in 24 hours.";

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(smtpUsername, password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = "Set your password",
                Body = body
            };

            message.To.Add(toEmail);
            await client.SendMailAsync(message);
        }
    }
}
