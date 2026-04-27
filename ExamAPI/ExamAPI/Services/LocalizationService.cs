using System.Collections.Generic;

namespace ExamAPI.Services
{
    public class LocalizationService
    {
        private static readonly Dictionary<string, Dictionary<string, string>> Messages = new()
        {
            // ──────────────────────────────────── AUTHENTICATION ────────────────────────────────────
            {
                "INVALID_CREDENTIALS", new Dictionary<string, string>
                {
                    { "en", "Invalid username or password" },
                    { "hi", "अमान्य उपयोगकर्ता नाम या पासवर्ड" },
                    { "gu", "અમાન્ય વપરાશકર્તા નામ અથવા પાસવર્ડ" }
                }
            },
            {
                "LOGIN_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Login successful" },
                    { "hi", "लॉगिन सफल" },
                    { "gu", "લૉગિન સફળ" }
                }
            },
            {
                "LOGOUT_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Logged out successfully" },
                    { "hi", "सफलतापूर्वक लॉगआउट हो गए" },
                    { "gu", "સફળતાપૂર્વક લૉગઆઉટ થઈ ગયા" }
                }
            },

            // ──────────────────────────────────── USERS ────────────────────────────────────
            {
                "USER_CREATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "User created successfully" },
                    { "hi", "उपयोगकर्ता सफलतापूर्वक बनाया गया" },
                    { "gu", "વપરાશકર્તા સફળતાપૂર્વક બનાવાયો" }
                }
            },
            {
                "USERNAME_TAKEN", new Dictionary<string, string>
                {
                    { "en", "Username '{0}' is already taken" },
                    { "hi", "उपयोगकर्ता नाम '{0}' पहले से मौजूद है" },
                    { "gu", "વપરાશકર્તા નામ '{0}' પહેલાથી લેવાયું છે" }
                }
            },
            {
                "USER_NOT_FOUND", new Dictionary<string, string>
                {
                    { "en", "User not found" },
                    { "hi", "उपयोगकर्ता नहीं मिला" },
                    { "gu", "વપરાશકર્તા નથી મળ્યો" }
                }
            },
            {
                "USER_UPDATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "User updated successfully" },
                    { "hi", "उपयोगकर्ता सफलतापूर्वक अपडेट किया गया" },
                    { "gu", "વપરાશકર્તા સફળતાપૂર્વક અપડેટ કરાયો" }
                }
            },
            {
                "USER_DELETED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "User deleted successfully" },
                    { "hi", "उपयोगकर्ता सफलतापूर्वक हटाया गया" },
                    { "gu", "વપરાશકર્તા સફળતાપૂર્વક કાઢી નાખાયો" }
                }
            },
            {
                "IMPORT_USERS_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Users imported successfully" },
                    { "hi", "उपयोगकर्ता सफलतापूर्वक आयात किए गए" },
                    { "gu", "વપરાશકર્તા સફળતાપૂર્વક આયાત કરાયા" }
                }
            },
            {
                "EMAIL_REQUIRED", new Dictionary<string, string>
                {
                    { "en", "Email is required" },
                    { "hi", "ईमेल आवश्यक है" },
                    { "gu", "ઇમેઇલ આવશ્યક છે" }
                }
            },
            {
                "NAME_REQUIRED", new Dictionary<string, string>
                {
                    { "en", "Full name is required" },
                    { "hi", "पूरा नाम आवश्यक है" },
                    { "gu", "પૂર્ણ નામ આવશ્યક છે" }
                }
            },
            {
                "EMAIL_ALREADY_EXISTS", new Dictionary<string, string>
                {
                    { "en", "Email already exists" },
                    { "hi", "ईमेल पहले से मौजूद है" },
                    { "gu", "ઇમેઇલ પહેલેથી હાજર છે" }
                }
            },
            {
                "EMAIL_INVALID", new Dictionary<string, string>
                {
                    { "en", "Please enter a valid email address" },
                    { "hi", "कृपया एक मान्य ईमेल पता दर्ज करें" },
                    { "gu", "કૃપા કરીને માન્ય ઇમેઇલ સરનામું દાખલ કરો" }
                }
            },
            {
                "INVITE_EMAIL_SEND_FAILED", new Dictionary<string, string>
                {
                    { "en", "Unable to send invitation email. Please verify SMTP settings and try again." },
                    { "hi", "आमंत्रण ईमेल भेजा नहीं जा सका। कृपया SMTP सेटिंग्स जांचें और फिर से प्रयास करें।" },
                    { "gu", "આમંત્રણ ઇમેઇલ મોકલી શકાયો નથી. કૃપા કરીને SMTP સેટિંગ્સ તપાસો અને ફરી પ્રયાસ કરો." }
                }
            },
            {
                "INVITE_INVALID", new Dictionary<string, string>
                {
                    { "en", "Invitation token is invalid" },
                    { "hi", "आमंत्रण टोकन अमान्य है" },
                    { "gu", "આમંત્રણ ટોકન અમાન્ય છે" }
                }
            },
            {
                "INVITE_EXPIRED", new Dictionary<string, string>
                {
                    { "en", "Invitation token has expired" },
                    { "hi", "आमंत्रण टोकन की समय सीमा समाप्त हो गई है" },
                    { "gu", "આમંત્રણ ટોકનની સમયમર્યાદા પૂર્ણ થઈ ગઈ છે" }
                }
            },
            {
                "INVITE_ALREADY_USED", new Dictionary<string, string>
                {
                    { "en", "Invitation token already used" },
                    { "hi", "आमंत्रण टोकन पहले ही उपयोग हो चुका है" },
                    { "gu", "આમંત્રણ ટોકન પહેલેથી ઉપયોગમાં લેવાયું છે" }
                }
            },
            {
                "PASSWORD_WEAK", new Dictionary<string, string>
                {
                    { "en", "Password does not meet strength requirements" },
                    { "hi", "पासवर्ड सुरक्षा आवश्यकताओं को पूरा नहीं करता" },
                    { "gu", "પાસવર્ડ સુરક્ષા માપદંડોને પૂર્ણ કરતો નથી" }
                }
            },
            {
                "PASSWORD_SET_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Password set successfully" },
                    { "hi", "पासवर्ड सफलतापूर्वक सेट हुआ" },
                    { "gu", "પાસવર્ડ સફળતાપૂર્વક સેટ થયો" }
                }
            },

            // ──────────────────────────────────── TESTS ────────────────────────────────────
            {
                "TEST_CREATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Test created successfully" },
                    { "hi", "परीक्षा सफलतापूर्वक बनाई गई" },
                    { "gu", "પરીક્ષા સફળતાપૂર્વક બનાવાઈ" }
                }
            },
            {
                "TEST_UPDATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Test updated successfully" },
                    { "hi", "परीक्षा सफलतापूर्वक अपडेट की गई" },
                    { "gu", "પરીક્ષા સફળતાપૂર્વક અપડેટ કરાઈ" }
                }
            },
            {
                "TEST_DELETED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Test deleted successfully" },
                    { "hi", "परीक्षा सफलतापूर्वक हटाई गई" },
                    { "gu", "પરીક્ષા સફળતાપૂર્વક કાઢી નાખાઈ" }
                }
            },
            {
                "TEST_NOT_FOUND", new Dictionary<string, string>
                {
                    { "en", "Test not found" },
                    { "hi", "परीक्षा नहीं मिली" },
                    { "gu", "પરીક્ષા નથી મળી" }
                }
            },
            {
                "TEST_START_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Test started successfully" },
                    { "hi", "परीक्षा सफलतापूर्वक शुरू की गई" },
                    { "gu", "પરીક્ષા સફળતાપૂર્વક શરૂ થઈ" }
                }
            },
            {
                "TEST_SUBMIT_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Test submitted successfully" },
                    { "hi", "परीक्षा सफलतापूर्वक जमा की गई" },
                    { "gu", "પરીક્ષા સફળતાપૂર્વક સબમિટ કરાઈ" }
                }
            },
            {
                "TEST_ALREADY_STARTED", new Dictionary<string, string>
                {
                    { "en", "Test already started" },
                    { "hi", "परीक्षा पहले से शुरू हो चुकी है" },
                    { "gu", "પરીક્ષા પહેલાથી શરૂ થઈ ચુક્કી છે" }
                }
            },
            {
                "TEST_TIME_EXPIRED", new Dictionary<string, string>
                {
                    { "en", "Test time has expired" },
                    { "hi", "परीक्षा का समय समाप्त हो गया" },
                    { "gu", "પરીક્ષાનો સમય સમાપ્ત થઈ ગયો" }
                }
            },

            // ──────────────────────────────────── QUESTIONS ────────────────────────────────────
            {
                "QUESTION_CREATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Question created successfully" },
                    { "hi", "प्रश्न सफलतापूर्वक बनाया गया" },
                    { "gu", "પ્રશ્ન સફળતાપૂર્વક બનાવાયો" }
                }
            },
            {
                "QUESTION_UPDATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Question updated successfully" },
                    { "hi", "प्रश्न सफलतापूर्वक अपडेट किया गया" },
                    { "gu", "પ્રશ્ન સફળતાપૂર્વક અપડેટ કરાયો" }
                }
            },
            {
                "QUESTION_DELETED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Question deleted successfully" },
                    { "hi", "प्रश्न सफलतापूर्वक हटाया गया" },
                    { "gu", "પ્રશ્ન સફળતાપૂર્વક કાઢી નાખાયો" }
                }
            },
            {
                "QUESTION_NOT_FOUND", new Dictionary<string, string>
                {
                    { "en", "Question not found" },
                    { "hi", "प्रश्न नहीं मिला" },
                    { "gu", "પ્રશ્ન નથી મળ્યો" }
                }
            },
            {
                "IMPORT_QUESTIONS_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Questions imported successfully" },
                    { "hi", "प्रश्न सफलतापूर्वक आयात किए गए" },
                    { "gu", "પ્રશ્નો સફળતાપૂર્વક આયાત કરાયા" }
                }
            },

            // ──────────────────────────────────── CLASSES ────────────────────────────────────
            {
                "CLASS_CREATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Class created successfully" },
                    { "hi", "कक्षा सफलतापूर्वक बनाई गई" },
                    { "gu", "ક્લાસ સફળતાપૂર્વક બનાવાઈ" }
                }
            },
            {
                "CLASS_UPDATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Class updated successfully" },
                    { "hi", "कक्षा सफलतापूर्वक अपडेट की गई" },
                    { "gu", "ક્લાસ સફળતાપૂર્વક અપડેટ કરાઈ" }
                }
            },
            {
                "CLASS_DELETED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Class deleted successfully" },
                    { "hi", "कक्षा सफलतापूर्वक हटाई गई" },
                    { "gu", "ક્લાસ સફળતાપૂર્વક કાઢી નાખાઈ" }
                }
            },
            {
                "CLASS_NOT_FOUND", new Dictionary<string, string>
                {
                    { "en", "Class not found" },
                    { "hi", "कक्षा नहीं मिली" },
                    { "gu", "ક્લાસ નથી મળી" }
                }
            },

            // ──────────────────────────────────── ACCESS CONTROL ────────────────────────────────────
            {
                "ACCESS_DENIED", new Dictionary<string, string>
                {
                    { "en", "Access denied" },
                    { "hi", "पहुंच अस्वीकृत" },
                    { "gu", "પ્રવેશ નકારી કાઢાયો" }
                }
            },
            {
                "UNAUTHORIZED", new Dictionary<string, string>
                {
                    { "en", "Unauthorized" },
                    { "hi", "अनधिकृत" },
                    { "gu", "અધિકૃત નથી" }
                }
            },
            {
                "FORBIDDEN", new Dictionary<string, string>
                {
                    { "en", "Forbidden" },
                    { "hi", "निषिद्ध" },
                    { "gu", "પ્રતિબંધિત" }
                }
            },

            // ──────────────────────────────────── PREFERENCES ────────────────────────────────────
            {
                "PREFERENCES_UPDATED_SUCCESS", new Dictionary<string, string>
                {
                    { "en", "Preferences updated successfully" },
                    { "hi", "पसंद सफलतापूर्वक अपडेट की गई" },
                    { "gu", "પસંદો સફળતાપૂર્વક અપડેટ કરાઈ" }
                }
            },

            // ──────────────────────────────────── ERRORS ────────────────────────────────────
            {
                "ERROR_UNKNOWN", new Dictionary<string, string>
                {
                    { "en", "An unknown error occurred" },
                    { "hi", "एक अज्ञात त्रुटि हुई" },
                    { "gu", "અજ્ઞાત ત્રુટિ આવી" }
                }
            },
            {
                "ERROR_INVALID_INPUT", new Dictionary<string, string>
                {
                    { "en", "Invalid input" },
                    { "hi", "अमान्य इनपुट" },
                    { "gu", "અમાન્ય ઇનપુટ" }
                }
            },
            {
                "ERROR_DATABASE", new Dictionary<string, string>
                {
                    { "en", "Database error occurred" },
                    { "hi", "डेटाबेस त्रुटि हुई" },
                    { "gu", "ડેટાબેસ ત્રુટિ આવી" }
                }
            },
        };

        public string GetMessage(string messageKey, string language = "en", params object[] args)
        {
            if (Messages.TryGetValue(messageKey, out var translations))
            {
                if (translations.TryGetValue(language, out var message))
                {
                    return args.Length > 0 ? string.Format(message, args) : message;
                }
                // Fallback to English if language not found
                if (translations.TryGetValue("en", out var englishMessage))
                {
                    return args.Length > 0 ? string.Format(englishMessage, args) : englishMessage;
                }
            }

            // Unknown key fallback
            return messageKey;
        }
    }
}
