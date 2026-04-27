# PHASE 3: Component Translation Replacement Patterns

## CRITICAL: All components must follow these exact patterns for 100% coverage

---

## PATTERN 1: Basic Component with useTranslation Hook

### ✅ REQUIRED PATTERN:

```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <button>{t('common.cancel')}</button>
    </div>
  );
}
```

### ❌ WRONG:
```tsx
// NO: Hardcoded text
<h1>Save</h1>
<button>Cancel</button>
```

---

## PATTERN 2: Dynamic Text with Parameters

### ✅ REQUIRED:
```tsx
// For messages with parameters, use:
const message = t('api.USERNAME_TAKEN', { 0: 'student59' });
// Will produce: "Username 'student59' is already taken"

// OR with named parameters:
const message = t('validation.minimumLength', { count: 8 });
```

---

## PATTERN 3: Form Labels & Placeholders

### ✅ REQUIRED:
```tsx
<TextField 
  label={t('user.username')}
  placeholder={t('auth.enterUsername')}
  error={!!errors.username}
  helperText={errors.username ? t('validation.required') : ''}
/>

<Select
  label={t('user.role')}
  defaultValue="User"
>
  <MenuItem value="User">{t('user.student')}</MenuItem>
  <MenuItem value="Admin">{t('user.admin')}</MenuItem>
</Select>
```

---

## PATTERN 4: Table Headers

### ✅ REQUIRED:
```tsx
<TableHead>
  <TableRow>
    <TableCell>{t('user.name')}</TableCell>
    <TableCell>{t('user.email')}</TableCell>
    <TableCell>{t('test.status')}</TableCell>
    <TableCell>{t('common.actions')}</TableCell>
  </TableRow>
</TableHead>
```

---

## PATTERN 5: Error Handling & API Responses

### ✅ REQUIRED:
```tsx
try {
  const response = await api.post('/admin/users', userData);
  // Response should have: { success: true, messageKey: 'USER_CREATED_SUCCESS' }
  const message = t(`api.${response.data.messageKey}`);
  toast.success(message);
} catch (error) {
  const messageKey = error.response?.data?.messageKey || 'ERROR_UNKNOWN';
  const message = t(`api.${messageKey}`);
  toast.error(message);
}
```

---

## PATTERN 6: Validation Messages

### ✅ REQUIRED:
```tsx
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

export function useValidationSchema() {
  const { t } = useTranslation();
  
  return yup.object().shape({
    username: yup.string()
      .required(t('validation.usernameRequired'))
      .min(3, t('validation.minimumLength', { count: 3 })),
    email: yup.string()
      .required(t('validation.emailRequired'))
      .email(t('validation.emailInvalid')),
    password: yup.string()
      .required(t('validation.passwordRequired'))
      .min(6, t('validation.minimumLength', { count: 6 })),
  });
}
```

---

## PATTERN 7: Empty States & Loading States

### ✅ REQUIRED:
```tsx
{data.length === 0 ? (
  <Typography variant="body1">{t('test.noTests')}</Typography>
) : (
  <Table>
    {/* render table */}
  </Table>
)}

{loading && <Typography>{t('common.loading')}</Typography>}

{error && (
  <Alert severity="error">{t(`api.${error.messageKey}`)}</Alert>
)}
```

---

## PATTERN 8: Modals & Confirmations

### ✅ REQUIRED:
```tsx
<Dialog open={openDelete}>
  <DialogTitle>{t('modal.confirmDelete')}</DialogTitle>
  <DialogContent>
    <Typography>{t('modal.areYouSure')}</Typography>
    <Typography variant="caption">{t('modal.thisActionCannotBeUndone')}</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDelete(false)}>
      {t('common.cancel')}
    </Button>
    <Button onClick={handleDelete} variant="contained">
      {t('common.delete')}
    </Button>
  </DialogActions>
</Dialog>
```

---

## PATTERN 9: Buttons & Links

### ✅ REQUIRED:
```tsx
// Buttons
<Button>{t('common.save')}</Button>
<Button>{t('common.cancel')}</Button>
<Button>{t('common.edit')}</Button>
<Button>{t('common.delete')}</Button>
<Button>{t('test.startTest')}</Button>
<Button>{t('test.submitTest')}</Button>

// Action menu items
<MenuItem onClick={handleEdit}>{t('common.edit')}</MenuItem>
<MenuItem onClick={handleDelete}>{t('common.delete')}</MenuItem>
<MenuItem onClick={handleView}>{t('common.actions')}</MenuItem>
```

---

## PATTERN 10: Toast Notifications

### ✅ REQUIRED:
```tsx
// Success
toast.success(t('api.USER_CREATED_SUCCESS'), {
  position: 'top-right',
  autoClose: 3000,
});

// Error
toast.error(t(`api.${error.messageKey}`), {
  position: 'top-right',
  autoClose: 3000,
});

// With parameters
toast.success(
  t('api.TEST_CREATED_SUCCESS'),
  { autoClose: 3000 }
);
```

---

## FILE CHECKLIST: Components to Update

### Admin Pages (13 files):
- [ ] AdminLogin.tsx
- [ ] Dashboard.tsx
- [ ] TestList.tsx
- [ ] CreateTest.tsx
- [ ] ManageClasses.tsx
- [ ] ManageTestQuestions.tsx
- [ ] ViewResults.tsx
- [ ] AnswerReview.tsx
- [ ] CreateUser.tsx
- [ ] CreateQuestion.tsx
- [ ] ImportQuestions.tsx
- [ ] QuestionBank.tsx
- [ ] TestBuilder.tsx

### SuperAdmin Pages (3 files):
- [ ] ManageAdmins.tsx
- [ ] SuperAdminDashboard.tsx
- [ ] SystemOverview.tsx

### User Pages (4 files):
- [ ] UserLogin.tsx
- [ ] Instructions.tsx
- [ ] TestPage.tsx (if exists)
- [ ] ResultPage.tsx

### Shared Components (3 files):
- [ ] Navbar.tsx — add language switcher
- [ ] ProtectedRoute.tsx
- [ ] PublicRoute.tsx

---

## LANGUAGE SWITCHER in Navbar

### ✅ REQUIRED:

```tsx
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setCurrentLang(lang);
    
    // Save to backend
    try {
      await api.patch('/user/preferences', { preferredLanguage: lang });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
    
    localStorage.setItem('preferredLanguage', lang);
  };

  return (
    <Select 
      value={currentLang}
      onChange={(e) => handleLanguageChange(e.target.value)}
      label={t('navbar.language')}
    >
      <MenuItem value="en">{t('common.en') || 'English'}</MenuItem>
      <MenuItem value="hi">{t('common.hi') || 'हिंदी'}</MenuItem>
      <MenuItem value="gu">{t('common.gu') || 'ગુજરાતી'}</MenuItem>
    </Select>
  );
}
```

---

## INITIALIZATION in main.tsx or App.tsx

### ✅ REQUIRED:

```tsx
import './i18n/i18n'; // Must be imported first
import i18n from 'i18next';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize language on app load
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    i18n.changeLanguage(savedLang);

    // If user is authenticated, fetch their language preference
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user/profile')
        .then(res => {
          i18n.changeLanguage(res.data.preferredLanguage || savedLang);
        })
        .catch(err => console.error('Failed to fetch user profile:', err));
    }
  }, []);

  return (
    <div className="app">
      {/* App content */}
    </div>
  );
}

export default App;
```

---

## STEP-BY-STEP COMPONENT UPDATE

1. **Add import at top:**
   ```tsx
   import { useTranslation } from 'react-i18next';
   ```

2. **Get translation function in component:**
   ```tsx
   const { t } = useTranslation();
   ```

3. **Replace ALL hardcoded strings:**
   - Page titles → `t('admin.dashboard')`
   - Button labels → `t('common.save')`
   - Form labels → `t('user.username')`
   - Placeholders → `t('auth.enterUsername')`
   - Table headers → `t('user.name')`
   - Error messages → `t(`api.${messageKey}`)`
   - Success messages → `t('api.USER_CREATED_SUCCESS')`
   - Empty states → `t('test.noTests')`
   - Loading text → `t('common.loading')`

4. **Test in all 3 languages:**
   - English (default)
   - Hindi (verify Devanagari renders)
   - Gujarati (verify Gujarati renders)

---

## VERIFY ZERO HARDCODED TEXT

Run this command to find any remaining hardcoded strings:

```bash
# Find all single/double quoted strings in component files
grep -r "\"[A-Z][a-z]*\"" src/pages/admin/*.tsx
grep -r "'[A-Z][a-z]*'" src/pages/admin/*.tsx

# Should return EMPTY if all are translated
```

---

## KEY COMPLIANCE CHECKLIST

✅ All UI labels translated
✅ All buttons translated
✅ All form placeholders/labels translated
✅ All error messages use messageKey from API
✅ All success messages use i18n keys
✅ All validation messages use i18n
✅ Empty/loading states translated
✅ Table headers translated
✅ Modal confirmations translated
✅ Dropdown options translated
✅ NO hardcoded text anywhere
✅ Language switcher in Navbar
✅ Language persists (localStorage + backend)
✅ All 3 fonts load correctly
✅ Hindi renders correctly
✅ Gujarati renders correctly
