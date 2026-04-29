# PRODUCTION READINESS - SOLUTIONS & CODE FIXES

This document provides ready-to-use code solutions for all issues identified in the Production Readiness Audit Report.

---

## 1. CRITICAL FIX: MOVE SECRETS TO ENVIRONMENT VARIABLES

### Current Problem
```json
// appsettings.json - EXPOSING SECRETS
{
  "Jwt": {
    "Key": "ExamSystem_SuperSecret_JWT_Key_2024!@#$%",
    "Issuer": "ExamAPI",
    "Audience": "ExamClient"
  },
  "Email": {
    "Username": "jitendra.dabhi@moneycareindia.com",
    "Password": "goncwiaitsscktep"
  },
  "Sms": {
    "UrlTemplate": "http://smsjust.com/sms/user/urlsms.php?username=...",
  }
}
```

### Solution: Update Program.cs

**File: `ExamAPI/Program.cs`**

```csharp
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

// Load configuration from multiple sources
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables()
    .AddUserSecrets<Program>(optional: !builder.Environment.IsProduction());

var env = builder.Environment;

// EPPlus license
ExcelPackage.License.SetNonCommercialOrganization("ExamAPI");

// ── Database ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

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
var jwtKey = jwtConfig["Key"]
    ?? throw new InvalidOperationException("JWT Key not configured. Set JWT:Key environment variable.");

var key = Encoding.UTF8.GetBytes(jwtKey);

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
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
            NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

// Validate production settings
if (env.IsProduction() && allowedOrigins.Length == 0)
{
    throw new InvalidOperationException("CORS allowed origins not configured for production.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                return true;

            if (!env.IsDevelopment())
                return false;

            // Only allow localhost in development
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                return false;

            var isLocalhost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("::1", StringComparison.OrdinalIgnoreCase);

            return uri.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase) && isLocalhost;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// ── Controllers + Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();

if (env.IsDevelopment())
{
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Exam API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme.",
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
}

var app = builder.Build();

// ── Security Headers ──────────────────────────────────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Add("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    
    if (env.IsProduction())
    {
        context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    await next();
});

// ── Middleware Pipeline ────────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

if (env.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS Redirection - ENABLE IN PRODUCTION
if (!env.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", environment = env.EnvironmentName }));

// Auto-migrate on startup (development only - use manual migrations in production)
if (env.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }
}

app.Run();
```

### Configuration Files

**File: `ExamAPI/appsettings.json` (No secrets!)**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": []
  }
}
```

**File: `ExamAPI/appsettings.Development.json` (Development only)**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=ExamDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "your-development-jwt-key-change-this-in-production-min-32-chars",
    "Issuer": "ExamAPI",
    "Audience": "ExamClient"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000"
    ]
  },
  "App": {
    "FrontendBaseUrl": "http://localhost:5173",
    "IncludeInvitePreviewLink": true
  },
  "Email": {
    "Enabled": true,
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "dev-email@example.com",
    "Password": "dev-app-password",
    "FromEmail": "dev-email@example.com",
    "FromName": "Exam Platform (Dev)"
  },
  "Otp": {
    "ExpiryMinutes": 5,
    "ResendAfterSeconds": 30,
    "MaxAttempts": 3
  },
  "Sms": {
    "Enabled": true,
    "UrlTemplate": "http://smsjust.com/sms/user/urlsms.php?username={{Username}}&pass={{Password}}&senderid={{SenderID}}&message={{Message}}&dest_mobileno={{MobileNo}}&msgtype=TXT&response=Y&dlttempid={{DLTTemplateId}}",
    "MessageTemplate": "Dear User, OTP for your account is {{Otp}} : ExamPlatform"
  }
}
```

**File: `ExamAPI/appsettings.Production.json` (Template - DO NOT COMMIT WITH REAL VALUES)**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-prod-server;Database=ExamDB;User Id=sa;Password=;Encrypt=true;TrustServerCertificate=false;"
  },
  "Jwt": {
    "Key": "SET_VIA_ENVIRONMENT_VARIABLE_OR_KEY_VAULT",
    "Issuer": "ExamAPI",
    "Audience": "ExamClient"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Error"
    }
  },
  "Cors": {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://app.yourdomain.com"
    ]
  },
  "App": {
    "FrontendBaseUrl": "https://yourdomain.com",
    "IncludeInvitePreviewLink": false
  },
  "Email": {
    "Enabled": true,
    "SmtpHost": "SET_VIA_ENVIRONMENT_VARIABLE",
    "SmtpPort": 587,
    "Username": "SET_VIA_ENVIRONMENT_VARIABLE",
    "Password": "SET_VIA_ENVIRONMENT_VARIABLE",
    "FromEmail": "SET_VIA_ENVIRONMENT_VARIABLE",
    "FromName": "Exam Platform"
  },
  "Otp": {
    "ExpiryMinutes": 10,
    "ResendAfterSeconds": 60,
    "MaxAttempts": 3
  }
}
```

### Environment Variables Setup

**For Azure deployment, set these in Key Vault or App Configuration:**

```bash
# Database
ConnectionStrings__DefaultConnection=Server=sql.azure.com;Database=ExamDB;User Id=admin;Password=...;Encrypt=true;TrustServerCertificate=false;

# JWT
Jwt__Key=your-super-secret-jwt-key-at-least-32-characters-long
Jwt__Issuer=ExamAPI
Jwt__Audience=ExamClient

# CORS
Cors__AllowedOrigins__0=https://yourdomain.com
Cors__AllowedOrigins__1=https://app.yourdomain.com

# Email
Email__SmtpHost=smtp.sendgrid.net
Email__SmtpPort=587
Email__Username=apikey
Email__Password=SG.xxxxxxxxxxxxx
Email__FromEmail=noreply@yourdomain.com
Email__FromName=Exam Platform
```

---

## 2. CRITICAL FIX: ENABLE HTTPS

### Enable HTTPS Redirection

Already added in the Program.cs above. Key lines:

```csharp
// HTTPS Redirection - ENABLE IN PRODUCTION
if (!env.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}
```

### Setup SSL Certificate

**Option 1: Azure App Service (Automatic)**
```bash
# In Azure Portal, configure HTTPS settings
# Use free Azure-managed certificates or import your own
```

**Option 2: Let's Encrypt (Self-hosted)**
```bash
# On Windows Server
# Use Certbot or similar tool to get free SSL cert
# Renew automatically with scheduled task
```

---

## 3. CRITICAL FIX: FRONTEND ENVIRONMENT CONFIG

### Create Environment Files

**File: `exam-frontend/.env.development`**

```env
VITE_API_BASE_URL=http://localhost:5121/api
VITE_APP_ENV=development
VITE_DEBUG=true
```

**File: `exam-frontend/.env.production`**

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_ENV=production
VITE_DEBUG=false
```

### Update axiosConfig.ts

**File: `exam-frontend/src/api/axiosConfig.ts`**

```typescript
import axios from 'axios';

// Get API base URL from environment variables
const getApiBaseUrl = (): string => {
  // First try environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Fallback: determine from window location
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${hostname}${port}/api`;
  }

  return 'http://localhost:5121/api';
};

const apiBaseUrl = getApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config) => {
    // Try to get token from secure storage
    const token = localStorage.getItem('token');
    // TODO: Migrate to HTTPOnly cookies
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch logout action instead of hard redirect
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error - no response from server');
      // Could retry or show user-friendly message
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Update vite.config.ts

**File: `exam-frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
    strictPort: false,
  },
  
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },

  build: {
    minify: 'terser',
    sourcemap: false, // Don't expose source maps
    target: 'ES2020',
    outDir: 'dist',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@mui/icons-material'],
          'vendor-state': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-i18n': ['i18next', 'react-i18next'],
        }
      }
    }
  },

  define: {
    'process.env.VITE_APP_ENV': JSON.stringify(process.env.VITE_APP_ENV || 'production')
  }
})
```

### Update package.json

**File: `exam-frontend/package.json` - scripts section**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:prod": "set VITE_APP_ENV=production&&vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 4. CRITICAL FIX: REMOVE HARDCODED SECRETS FROM MIGRATIONS

### Remove seeded admin account

**File: `ExamAPI/Data/AppDbContext.cs`**

```csharp
// REMOVE the HasData() section that seeds the admin user
// Instead, document the admin creation process:

// NOTE: Admin user must be created during deployment
// Run the following script after database migration:
/*
  INSERT INTO Users (Name, Username, PasswordHash, Email, Role, IsActive, CreatedAt, AdminScope)
  VALUES ('System Admin', 'admin', '$2a$11$HASH_OF_PASSWORD', 'admin@company.com', 'Admin', 1, GETUTCDATE(), 'Global');
*/
```

Create a setup script instead:

**File: `ExamAPI/Scripts/CreateDefaultAdmin.sql`**

```sql
-- Run this script after deploying to production
-- Replace values with secure credentials

DECLARE @AdminPassword NVARCHAR(MAX) = 'SET_SECURE_PASSWORD_HERE';
DECLARE @AdminEmail NVARCHAR(256) = 'admin@company.com';

-- NOTE: Password should be hashed using BCrypt before inserting
-- Use the application's AuthService to generate the hash

INSERT INTO Users (Name, Username, PasswordHash, Email, Role, IsActive, IsEmailVerified, CreatedAt, PreferredLanguage)
VALUES (
    'System Administrator',
    'admin',
    -- Use BCrypt hash of password
    '$2a$11$GENERATED_BCRYPT_HASH_HERE',
    @AdminEmail,
    'Admin',
    1,
    0,
    GETUTCDATE(),
    'en'
);

-- IMPORTANT: Change admin password on first login
```

---

## 5. HIGH FIX: IMPLEMENT RATE LIMITING

### Install NuGet Package

```bash
dotnet add package AspNetCoreRateLimit
```

### Update Program.cs - Add rate limiting

```csharp
using AspNetCoreRateLimit;

// After CORS configuration, add:
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(options =>
{
    options.EnableEndpointRateLimiting = true;
    options.StackBlockedRequests = false;
    options.HttpStatusCode = 429;
    options.RealIpHeader = "X-Real-IP";
    options.ClientIdHeader = "X-Client-ID";
    
    options.GeneralRules = new List<RateLimitRule>
    {
        // Default: 100 requests per minute per IP
        new RateLimitRule
        {
            Endpoint = "*",
            Period = "1m",
            Limit = 100,
            QuotaExceededResponse = new QuotaExceededResponse
            {
                Message = "API rate limit exceeded. Please try again later.",
                StatusCode = 429
            }
        },
        // Auth endpoints: 5 attempts per 15 minutes
        new RateLimitRule
        {
            Endpoint = "*/auth/login",
            Period = "15m",
            Limit = 5,
            QuotaExceededResponse = new QuotaExceededResponse
            {
                Message = "Too many login attempts. Please try again in 15 minutes.",
                StatusCode = 429
            }
        },
        new RateLimitRule
        {
            Endpoint = "*/auth/send-otp",
            Period = "15m",
            Limit = 5,
            QuotaExceededResponse = new QuotaExceededResponse
            {
                Message = "Too many OTP requests. Please try again later.",
                StatusCode = 429
            }
        },
        new RateLimitRule
        {
            Endpoint = "*/auth/verify-otp",
            Period = "15m",
            Limit = 5,
            QuotaExceededResponse = new QuotaExceededResponse
            {
                Message = "Too many OTP verification attempts.",
                StatusCode = 429
            }
        }
    };
});

builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();

// In middleware pipeline, after CORS:
app.UseIpRateLimiting();
```

---

## 6. HIGH FIX: ADD INPUT VALIDATION

### Create Validation Service

**File: `ExamAPI/Services/ValidationService.cs`**

```csharp
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace ExamAPI.Services
{
    public interface IValidationService
    {
        void ValidateEmail(string email);
        void ValidateMobileNumber(string mobile);
        void ValidatePassword(string password);
        void ValidateUsername(string username);
    }

    public class ValidationService : IValidationService
    {
        public void ValidateEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email is required");

            var emailAttribute = new EmailAddressAttribute();
            if (!emailAttribute.IsValid(email))
                throw new ArgumentException("Email format is invalid");

            if (email.Length > 256)
                throw new ArgumentException("Email is too long (max 256 characters)");
        }

        public void ValidateMobileNumber(string mobile)
        {
            if (string.IsNullOrWhiteSpace(mobile))
                throw new ArgumentException("Mobile number is required");

            // Remove all non-digits
            var digitsOnly = Regex.Replace(mobile, @"[^\d]", "");

            if (digitsOnly.Length != 10)
                throw new ArgumentException("Mobile number must be 10 digits");

            if (!Regex.IsMatch(digitsOnly, @"^[6-9]\d{9}$"))
                throw new ArgumentException("Invalid mobile number format");
        }

        public void ValidatePassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("Password is required");

            if (password.Length < 8)
                throw new ArgumentException("Password must be at least 8 characters");

            if (password.Length > 128)
                throw new ArgumentException("Password is too long");

            // Check for uppercase, lowercase, digit, special character
            if (!Regex.IsMatch(password, @"[A-Z]"))
                throw new ArgumentException("Password must contain an uppercase letter");

            if (!Regex.IsMatch(password, @"[a-z]"))
                throw new ArgumentException("Password must contain a lowercase letter");

            if (!Regex.IsMatch(password, @"[0-9]"))
                throw new ArgumentException("Password must contain a digit");

            if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':"",.<>?/\\|`~]"))
                throw new ArgumentException("Password must contain a special character");
        }

        public void ValidateUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                throw new ArgumentException("Username is required");

            if (username.Length < 3 || username.Length > 50)
                throw new ArgumentException("Username must be 3-50 characters");

            if (!Regex.IsMatch(username, @"^[a-zA-Z0-9_-]+$"))
                throw new ArgumentException("Username can only contain letters, numbers, underscores, and hyphens");
        }
    }
}
```

### Register Validation Service

In `Program.cs`:
```csharp
builder.Services.AddScoped<IValidationService, ValidationService>();
```

### Use in Controllers

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request, IValidationService validator)
{
    try
    {
        validator.ValidateUsername(request.Username);
        validator.ValidatePassword(request.Password);
        // ... rest of login logic
    }
    catch (ArgumentException ex)
    {
        return BadRequest(new ApiResponse { MessageKey = "ERROR_INVALID_INPUT", Message = ex.Message });
    }
}
```

---

## 7. HIGH FIX: MIGRATE TO HTTPSONLY COOKIES

### Update AuthService to return cookie

**File: `ExamAPI/Services/AuthService.cs`**

```csharp
public class LoginResponse
{
    public string Message { get; set; }
    public string Role { get; set; }
    public string Name { get; set; }
    public int UserId { get; set; }
    public int? AdminId { get; set; }
    // Remove: public string Token { get; set; } - Token will be in cookie
}
```

### Update Login Controller

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    var result = await _authService.LoginAsync(request.Username, request.Password);
    
    if (!result.Success)
    {
        return Unauthorized(new ApiResponse { MessageKey = result.MessageKey, Message = result.Message });
    }

    // Set JWT token as HTTPOnly cookie
    var cookieOptions = new CookieOptions
    {
        HttpOnly = true,           // Not accessible from JavaScript
        Secure = !_env.IsDevelopment(), // Only HTTPS in production
        SameSite = SameSiteMode.Strict, // CSRF protection
        Expires = DateTimeOffset.UtcNow.AddHours(24)
    };

    Response.Cookies.Append("authToken", result.Token, cookieOptions);

    return Ok(new ApiResponse<LoginResponse>
    {
        Success = true,
        Data = new LoginResponse
        {
            Message = "Login successful",
            Role = result.Role,
            Name = result.Name,
            UserId = result.UserId,
            AdminId = result.AdminId
        }
    });
}
```

### Update Frontend to use cookies

**File: `exam-frontend/src/api/axiosConfig.ts`**

```typescript
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// No need to manually add Authorization header - cookie is automatic
```

---

## 8. HIGH FIX: DISABLE SWAGGER IN PRODUCTION

Already fixed in Program.cs above:

```csharp
if (env.IsDevelopment())
{
    builder.Services.AddSwaggerGen(c => { ... });
}

// ... later

if (env.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

---

## 9. MEDIUM FIX: ADD SECURITY HEADERS MIDDLEWARE

### Create SecurityHeadersMiddleware

**File: `ExamAPI/Middleware/SecurityHeadersMiddleware.cs`**

```csharp
namespace ExamAPI.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IHostEnvironment _env;

        public SecurityHeadersMiddleware(RequestDelegate next, IHostEnvironment env)
        {
            _next = next;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Content Security Policy
            context.Response.Headers.Add("Content-Security-Policy", 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Relax for MUI
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self' https:; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'"
            );

            // Additional security headers
            context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Add("X-Frame-Options", "DENY");
            context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
            context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
            context.Response.Headers.Add("Permissions-Policy", 
                "geolocation=(), microphone=(), camera=(), payment=()");

            if (!_env.IsDevelopment())
            {
                // HSTS for production only
                context.Response.Headers.Add("Strict-Transport-Security", 
                    "max-age=31536000; includeSubDomains; preload");
            }

            await _next(context);
        }
    }
}
```

### Register in Program.cs

```csharp
app.UseMiddleware<SecurityHeadersMiddleware>();
```

---

## 10. MEDIUM FIX: IMPLEMENT LOGGING

### Add Serilog

```bash
dotnet add package Serilog
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
dotnet add package Serilog.Enrichers.Environment
```

### Configure Serilog in Program.cs

```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Is(builder.Environment.IsDevelopment() ? LogEventLevel.Information : LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentUserName()
    .Enrich.WithMachineName()
    .WriteTo.Console()
    .WriteTo.File(
        path: "logs/app-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        fileSizeLimitBytes: 1024 * 1024 * 10, // 10MB
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();
```

---

## 11. REMOVE DEBUG CODE FROM FRONTEND

### Remove console.log statements

**File: `exam-frontend/src/components/Navbar.tsx` - Line 41**

```typescript
// REMOVE:
console.log('Language saved locally');

// Or replace with proper logging:
const logger = {
  debug: (msg: string) => {
    if (import.meta.env.DEV) console.log(`[DEBUG] ${msg}`);
  }
};
logger.debug('Language saved locally');
```

---

## 12. CREATE .gitignore ENTRIES

**File: `ExamAPI/.gitignore`**

```
# Add to existing .gitignore
appsettings.Production.json
appsettings.*.local.json
*.log
logs/
.env
.env.local
.env.production
.env.production.local
user-secrets/
secrets/
```

**File: `exam-frontend/.gitignore`**

```
# Add to existing .gitignore
.env.production
.env.production.local
.env.local
dist/
*.log
build/
.DS_Store
```

---

## DEPLOYMENT SCRIPTS

### Windows Deployment Script

**File: `deploy-production.ps1`**

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$Environment = "Production",
    [string]$ApiVersion = "1.0.0"
)

Write-Host "Starting $Environment deployment..." -ForegroundColor Green

# Build Backend
Write-Host "Building backend..." -ForegroundColor Yellow
cd ExamAPI/ExamAPI
dotnet clean
dotnet restore
dotnet build -c Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Backend build successful" -ForegroundColor Green

# Build Frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
cd ../../exam-frontend
npm install
npm run build:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend build successful" -ForegroundColor Green

# Deploy
Write-Host "Deploying to $Environment..." -ForegroundColor Yellow
# Add your deployment commands here (Azure, IIS, Docker, etc.)

Write-Host "Deployment complete!" -ForegroundColor Green
```

---

## VERIFICATION CHECKLIST

Before going to production, verify:

- [ ] All secrets in environment variables or Key Vault
- [ ] HTTPS enabled with valid certificate
- [ ] CORS configured for production domain only
- [ ] Swagger UI disabled in production
- [ ] Rate limiting implemented
- [ ] Security headers present
- [ ] Logging configured
- [ ] Database backups working
- [ ] No console.log statements in production build
- [ ] Error messages don't expose internals
- [ ] Database migrations tested
- [ ] Load testing completed
- [ ] Security audit passed

---

**This document provides ready-to-use solutions. Implement them systematically and test thoroughly before production deployment.**
