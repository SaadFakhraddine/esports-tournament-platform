# Security Documentation

## Open Redirect Vulnerability - Fixed ✅

### Issue
The login page was vulnerable to open redirect attacks where an attacker could craft a malicious URL to redirect authenticated users to external phishing sites.

**Attack Example:**
```
https://yoursite.com/login?returnUrl=https://evil.com/phishing
```

After successful login, the user would be redirected to `evil.com` instead of your site.

### Solution
Implemented **allowlist-based redirect validation** with prefix matching.

#### Implementation Details

**Utility Function:** `src/lib/security/redirect-validation.ts`

**Security Checks:**
1. ✅ **Relative paths only** - Must start with `/`
2. ✅ **No protocol-relative URLs** - Blocks `//evil.com`
3. ✅ **URL decoding** - Catches encoded attacks like `%2F%2Fevil.com`
4. ✅ **Allowlist enforcement** - Only approved path prefixes allowed
5. ✅ **Backslash prevention** - Blocks Windows path tricks
6. ✅ **Protocol blocking** - Rejects `javascript:`, `data:`, `file:`, etc.

**Allowed Redirect Prefixes:**
- `/dashboard`
- `/tournaments`
- `/teams`
- `/profile`
- `/settings`

#### Usage

```typescript
import { validateRedirectUrl } from '@/lib/security/redirect-validation'

// In your component
const returnUrl = validateRedirectUrl(searchParams?.get('returnUrl'))

// Safe examples
validateRedirectUrl('/tournaments/123') // ✅ '/tournaments/123'
validateRedirectUrl('https://evil.com') // ❌ '/dashboard' (default)
validateRedirectUrl('//evil.com')       // ❌ '/dashboard'
validateRedirectUrl('%2F%2Fevil.com')   // ❌ '/dashboard'
```

#### Testing

Comprehensive test suite covers 30+ attack vectors:
- External URLs (https://, http://)
- Protocol-relative URLs (//)
- URL encoding attacks
- Path traversal
- JavaScript/Data URLs
- Real-world phishing scenarios

Run tests:
```bash
npm test redirect-validation
```

---

## Security Checklist

### ✅ Completed
- [x] Open redirect vulnerability fixed
- [x] Redirect validation with allowlist
- [x] URL encoding attack prevention
- [x] Comprehensive test coverage

### 🚨 Critical (To Do)
- [ ] Rotate exposed database credentials
- [ ] Remove .env from git history
- [ ] Generate strong NextAuth secret
- [ ] Remove all debug logging (passwords, tokens)
- [ ] Fix email exposure in user search

### 🟠 High Priority (To Do)
- [ ] Add rate limiting to auth endpoints
- [ ] Remove API debug logging
- [ ] Add security headers (CSP, X-Frame-Options)

### 🟡 Medium Priority (To Do)
- [ ] Implement CSRF middleware
- [ ] Add audit logging for sensitive operations
- [ ] Validate session updates
- [ ] Add input length limits on search

### 🔵 Low Priority (To Do)
- [ ] Strengthen password requirements (12+ chars, complexity)
- [ ] Add email verification
- [ ] Configure session timeouts
- [ ] Sanitize user-generated content

---

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com (replace with actual email).

**Do NOT** create public GitHub issues for security vulnerabilities.

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Open Redirect Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- [tRPC Security Best Practices](https://trpc.io/docs/server/error-handling)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
