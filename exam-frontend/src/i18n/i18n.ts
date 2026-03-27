import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      "login": "Login",
      "username": "Username",
      "password": "Password",
      "adminDashboard": "Admin Dashboard",
      "userDashboard": "User Dashboard",
      "logout": "Logout",
      "startTest": "Start Test",
      "submitTest": "Submit Test",
      "next": "Next",
      "previous": "Previous",
      "timeLeft": "Time Left",
      // add more as needed
    }
  },
  hi: {
    translation: {
      "login": "लॉग इन करें",
      "username": "उपयोगकर्ता नाम",
      "password": "पासवर्ड",
      "adminDashboard": "व्यवस्थापक डैशबोर्ड",
      "userDashboard": "उपयोगकर्ता डैशबोर्ड",
      "logout": "लॉग आउट",
      "startTest": "परीक्षा शुरू करें",
      "submitTest": "परीक्षा जमा करें",
      "next": "अगला",
      "previous": "पिछला",
      "timeLeft": "समय शेष",
    }
  },
  gu: {
    translation: {
      "login": "લૉગિન કરો",
      "username": "વપરાશકર્તા નામ",
      "password": "પાસવર્ડ",
      "adminDashboard": "એડમિન ડેશબોર્ડ",
      "userDashboard": "વપરાશકર્તા ડેશબોર્ડ",
      "logout": "લૉગ આઉટ",
      "startTest": "પરીક્ષા શરૂ કરો",
      "submitTest": "પરીક્ષા સબમિટ કરો",
      "next": "આગળ",
      "previous": "પાછળ",
      "timeLeft": "બચેલો સમય",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
