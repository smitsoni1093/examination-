using System.Text;
using ExamAPI.Data;
using ExamAPI.Services;
using ExamAPI.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OfficeOpenXml;

var builder = WebApplication.CreateBuilder(args);

// EPPlus 8+ requires setting the static license before creating any ExcelPackage instances.
ExcelPackage.License.SetNonCommercialOrganization("ExamAPI");

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddMemoryCache();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<ClassService>();
builder.Services.AddScoped<SuperAdminService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AttemptService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<ISmsService, UrlTemplateSmsService>();
builder.Services.AddSingleton<LocalizationService>();
builder.Services.AddHttpClient();

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtConfig = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtConfig["Key"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig["Issuer"],
            ValidAudience = jwtConfig["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            // Ensure standard role and name claims are matched correctly
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
            NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.SetIsOriginAllowed(origin =>
              {
                  if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                  {
                      return true;
                  }

                  if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                  {
                      return false;
                  }

                  // Allow local frontend dev servers (Vite often shifts ports when busy).
                  var isLocalhost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);
                  var isLanIp = uri.Host.Equals("192.168.20.14", StringComparison.OrdinalIgnoreCase);
                //   var isLanIp = uri.Host.Equals("10.198.96.67", StringComparison.OrdinalIgnoreCase);
                  return uri.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase)
                         && (isLocalhost || isLanIp)
                         && uri.Port >= 5173
                         && uri.Port <= 5185;
              })
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ── Controllers + Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Exam API", Version = "v1" });
    // Add JWT auth to Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── Middleware Pipeline ────────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection(); // Keep it HTTP for easy local development
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

// ── Auto-migrate on startup ───────────────────────────────────────────────────
var skipDatabaseMigration = app.Configuration.GetValue<bool?>("SkipDatabaseMigration") ??
                            string.Equals(Environment.GetEnvironmentVariable("SKIP_DB_MIGRATION"), "true", StringComparison.OrdinalIgnoreCase);

if (!skipDatabaseMigration)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();