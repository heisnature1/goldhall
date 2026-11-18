# Supabase Auth — settings the emails depend on

The site code is only half of what makes sign-up and password reset work. The
other half lives in your Supabase project, and a wrong value there shows up as
"the form worked but no email arrived" — so check these before blaming the
frontend.

Project ref used by the Gold Hall site: `giagijfseqsrjkafruax`
Site URL: `https://goldhall.vercel.app`

---

## 1. Publishable key in Vercel

The browser needs a key that can call Auth and nothing else.

Vercel → **Settings → Environment Variables → Production**:

| Variable | Value |
| --- | --- |
| `GOLDHALL_SUPABASE_URL` | `https://giagijfseqsrjkafruax.supabase.co` |
| `GOLDHALL_SUPABASE_PUBLISHABLE_KEY` | the **publishable** key (`sb_publishable_…`) |
| `GOLDHALL_SUPABASE_KEY` | the **secret** key — server-side only, used by the admin portal |
| `GOLDHALL_SITE_URL` | `https://goldhall.vercel.app` (optional; inferred from the request if absent) |

`api/auth-config.php` serves the first two to the browser and **refuses** to
serve anything that starts with `sb_secret_`. If you paste the secret key into
the publishable variable, Auth switches itself off rather than leaking it.

Redeploy after changing these — env vars are baked in at build time.

## 2. Custom SMTP

Dashboard → **Authentication → Emails → SMTP Settings**.

- **Enable custom SMTP** and fill in host, port (usually 587 with STARTTLS, or
  465 with TLS), username, password and sender address.
- **Sender email** must be a domain you have verified with your SMTP provider,
  otherwise messages are silently dropped or land in spam.
- Use **Send test email** and confirm it arrives *before* testing the sign-up
  form. This one button separates "our code is broken" from "your provider is
  rejecting mail".

Every confirmation, recovery and password-change email goes through this
provider. The site never sends mail itself.

## 3. URL configuration — the part that breaks reset links

Dashboard → **Authentication → URL Configuration**.

| Setting | Value |
| --- | --- |
| **Site URL** | `https://goldhall.vercel.app` |
| **Redirect URLs** | `https://goldhall.vercel.app/reset-password`<br>`https://goldhall.vercel.app/confirm-email`<br>`http://localhost:8000/reset-password`<br>`http://localhost:8000/confirm-email` |

Notes:

- **Exactly these paths.** The code passes `redirect_to` as
  `<site>/reset-password`; if that path is not in the allow-list Supabase
  silently falls back to the Site URL, and the user lands on the home page with
  a `#access_token=…` fragment that nothing consumes.
- Wildcards are allowed if you prefer fewer entries:
  `https://goldhall.vercel.app/**`.
- Preview deployments have a different host per deploy. Either add
  `https://*-<your-team>.vercel.app/**` or just add the specific preview URL
  while testing; otherwise reset links generated on a preview domain will be
  rejected.

## 4. Email confirmation and the templates

Dashboard → **Authentication → Sign In / Providers → Email**.

- **Confirm email**: keep this **on**. The sign-up form expects it — it tells
  the student to open the link rather than dropping them straight into the hub.
- **Secure email change**: on.
- **Minimum password length**: 8 (the form enforces the same).

Dashboard → **Authentication → Emails → Templates**:

- *Confirm signup* — subject and body. Use `{{ .ConfirmationURL }}` for the link;
  it already contains the correct site URL and token.
- *Reset password* — same, with `{{ .ConfirmationURL }}`.
- Add the hall's name and a line saying the link expires shortly, so students
  do not sit on it.

Both templates are edited in Supabase, not in this repo — changing them here
would do nothing.

## 5. Rate limits

Dashboard → **Authentication → Rate Limits**.

The defaults allow only a few emails per hour per address and per project. While
testing, repeated sign-ups will start failing with *"Too many attempts"*; the
form says so rather than showing a raw API error. Raise
**Email rate limit** temporarily, then set it back.

## 6. What the site does on each step

| Step | Browser call | Email | Lands on |
| --- | --- | --- | --- |
| Create account | `auth.signUp()` | Confirm signup | `/confirm-email` |
| Sign in | `auth.signInWithPassword()` | — | `/dashboard` |
| Forgot password | `auth.resetPasswordForEmail()` | Reset password | `/reset-password` |
| Choose new password | `auth.updateUser({ password })` | — | `/student` |

The recovery token lives in the URL fragment (`#access_token=…`), which is never
sent to a server, so it cannot leak through logs. `reset-password.js` exchanges
it in the browser, uses it once, and clears the address bar.

## 7. Verification checklist

1. `GET /api/auth-config.php` returns `"enabled": true` with a key starting
   `sb_publishable_`. If it is `false`, the env vars are missing from the
   environment that was deployed.
2. **Send test email** in SMTP settings arrives.
3. Sign up with a real address → confirmation email arrives → the link opens
   `/confirm-email` and says "Email confirmed".
4. Sign in with the confirmed account → `/dashboard`.
5. "Forgot your password?" → email arrives → the link opens `/reset-password`
   with the email filled in → set a new password → sign in with it.
6. Re-open the same reset link → it is refused as already used.
