# Gold Refinery Hall website

A PHP website for Gold Refinery Hall, University of Mines and Technology, with a browser-based Student Hub and Administrator Portal.

The site was migrated from static `.html` files to PHP with **no change to the design, styles or animations** — the same stylesheets, the same `fx.js` engine, the same loader. What changed is where the content comes from: pages are rendered on the server from a JSON file the admin portal writes to, instead of being built in the browser from `localStorage`.

## Navigation

The main menu is intentionally short and identical on every page:

**Home · Student Hub · Executives · Events · Gallery · About Us**

The Student Hub entry is highlighted; the rest of the site is reached from the home page
sections and the footer. The Admin Portal stays available from the **Login** button on the
home page. The signed-in Student Hub page (`dashboard.html`) is deliberately **not** listed
in any menu — it is reached only by signing in.

## Student Hub features

Open `student.html` to register or sign in. Creating an account shows a **confirmation
pop-up** with the new student's details and a button into the hub, and sign-in sends the
student to `dashboard.html` — a separate members-only page that only signed-in students
can open. Registration collects:

- Full name and UMaT Student ID
- Student email (official UMaT student email) and personal email
- Programme and academic level (**Levels 100 to 400**)
- Room / bedspace and Resident / Non-Resident status
- A password (8 characters minimum)

The Student Hub includes:
- **Scholarships & Internships**: Dynamically managed funding schemes, industrial attachments, and application portals with direct links and details updated by the Hall Administrator.
- **Grievance Desk**: A dedicated complaint and maintenance desk where students can lodge complaints (room repairs, plumbing, electrical, safety, amenities), choose urgency levels, optionally submit anonymously, and track administrative investigation notes and action resolutions in real time.
- **Hall Announcements & Shuttle Schedule**: Freshers Akwaaba, Hall Week updates, and indicative weekday campus shuttle departures.
- **Hall Polls**: Free online student voting for executive positions and student honours.
- **Access Completion**: A student can mark their studies complete in the hub, and the administrator can also mark an account completed; completed accounts are blocked from signing in and voting.

## Preview administrator

Open `admin.php` and sign in. If no environment variables are set the preview account still works:

- Username: `admin`
- Password: `goldhall`

The administrator can:
- **Manage Scholarships & Internships**: Add, edit, delete, publish/unpublish, and link scholarships and internship listings with custom action button labels, application URLs, categories, deadlines, and picture banners.
- **Grievance & Complaint Desk**: Review all submitted complaints, filter by status (Pending, In Progress, Resolved, Closed), category, and priority, search tickets, assign maintenance units / officers, record official action notes, and update student resolution statuses.
- **Manage Website Content**: Add and edit Executives, Events, Gallery and Scholarships/Internships content with images and link addresses.
- **Gallery uploads**: Upload photos of what is going on at the hall (freshers' welcome, hall week, sports, projects). Published photos appear both in the home page "Life at Gold Hall" grid and on the Gallery page.
- **Student Access & Polls**: Review registered student accounts, mark accounts completed or restore access, configure poll positions and candidates, and toggle election voting.

### Editing content (link + picture)

Every content type (Executives, Events, Gallery, Scholarships, Internships) can be edited with:

- **Title, description, category / deadline / eligibility label**
- **Link & Button Label** — the address the card button opens and optional custom button text.
- **Picture** — either **upload a picture from the device** (scaled down to 1280px before it is sent) **or paste a picture link**. Uploads are validated as real images and renamed; they go to the `uploads` bucket on Supabase when it is configured, and to `assets/uploads/` on the server otherwise.

## Running it

Requires PHP 8.1 or newer. There are no dependencies and no build step.

```bash
php -S localhost:8000 router.php     # or: composer serve
```

`router.php` mirrors the `.htaccess` rules so pretty URLs (`/about`, `/executives`) work locally. On Apache, point a virtual host at the directory, set `AllowOverride All`, and `.htaccess` handles the rest. `DirectoryIndex` is `index.php`.

### Content in Supabase

Supabase is optional. Set these two environment variables and the whole content layer moves to Supabase; leave them unset and the site uses `data/content.json` exactly as before.

```
GOLDHALL_SUPABASE_URL=https://your-project-ref.supabase.co
GOLDHALL_SUPABASE_KEY=<secret key>
GOLDHALL_SUPABASE_BUCKET=uploads        # optional, this is the default
```

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are accepted as fallbacks.

**Which key.** Supabase now issues two kinds of key, and both work here:

| Key | Looks like | Can the portal save? |
| --- | --- | --- |
| secret | `sb_secret_…` | yes |
| legacy `service_role` | `eyJ…` (a JWT) | yes |
| publishable | `sb_publishable_…` | **no — read-only** |

The publishable key belongs in browsers; the site never uses it, because every page is rendered on the server. Only a secret key can write, and it must never reach the browser, a screenshot or a chat message. The admin portal shows which of these is in play at the top of the page, so a read-only key is obvious before anyone tries to save. On Vercel they go in **Settings → Environment Variables**, then redeploy. Locally, put them in a `.env` file in the project root (gitignored).

Setup, once per project:

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste `supabase-schema.sql`, run it. That creates the `content_items` table, enables row-level security (public read, no public write) and creates a public `uploads` storage bucket.
3. Copy the **Project URL** and a **secret** key (*Project Settings → API Keys*, or *Legacy API keys → `service_role`*) into the environment variables.
4. Deploy, then open the admin portal. The table is empty at that point, so the site imports the 30 seed items into Supabase on the first page load — no manual data entry.

How it behaves:

- Public pages read from Supabase on every request; the secret key never leaves the server. Only a JWT key is also sent as an `Authorization: Bearer` header — the `sb_secret_…` format is rejected there, so it travels in `apikey` alone.
- `admin.php` shows a status line: connected (with the item count), read-only key, or not configured.
- The admin portal's save, delete and upload go straight to Supabase (`content_items` rows and the `uploads` bucket).
- If Supabase is unreachable, the site falls back to the local seed instead of showing an empty page.
- To reset content, run `truncate public.content_items;` in the SQL Editor and reload — the seed is re-imported.

### Student accounts (Supabase Auth)

The Student Hub signs students up and in with Supabase Auth, so passwords never
touch this codebase. Three flows are wired:

| Action | Call | Email (sent by your SMTP) | Lands on |
| --- | --- | --- | --- |
| Create account | `auth.signUp()` | Confirm signup | `/confirm-email` |
| Forgot password | `auth.resetPasswordForEmail()` | Reset password | `/reset-password` |
| Choose new password | `auth.updateUser({ password })` | — | `/student` |

Set one extra variable — the **publishable** key, never the secret one:

```
GOLDHALL_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
GOLDHALL_SITE_URL=https://goldhall.vercel.app     # optional
```

`api/auth-config.php` hands that key and the project URL to the browser, and
deliberately refuses to serve a key starting `sb_secret_` — if the secret lands
in that variable, Auth switches itself off rather than leaking it. The admin
portal keeps using `GOLDHALL_SUPABASE_KEY` server-side.

**Emails go through your SMTP provider.** The site never sends mail; Supabase
delivers the confirmation and reset messages using the SMTP settings in
*Authentication → Emails → SMTP Settings*. Subject lines, bodies and the sender
are edited there.

**The redirect allow-list is what makes the links work.** In
*Authentication → URL Configuration*, the Site URL must be your domain and the
Redirect URLs must include `<site>/reset-password` and `<site>/confirm-email`.
If a path is missing, Supabase silently falls back to the Site URL and the
student lands on the home page with an unusable token.

See **`supabase-auth-setup.md`** for the full checklist, including SMTP, email
templates and rate limits.

Without the publishable key the hub keeps its original browser-only prototype
accounts, so the site still works with no Auth configured. The card under the
form says which mode is active, including when the library itself failed to
load.

### Hosting

The site runs on any PHP host — Apache/cPanel, DigitalOcean, Hostinger, a VPS — with no build step and no dependencies. Two things need writing on that kind of host: `data/` (the content file) and `assets/uploads/` (portal pictures). Both return a clear error if they are not writable.

#### Vercel

Vercel runs PHP through `vercel.json`: `vercel-php@0.9.0` under `api/`, with `api/index.php` dispatching every page because Vercel only executes PHP inside `api/`.

Three rules keep it working, and each one exists because of a real failure:

1. **PHP outside `api/` is never executed.** Every page request is rewritten to `api/index.php`, which `require`s the real page from the project root.
2. **Redirects run before the filesystem, rewrites after it.** Because a real `index.php` sits in the root, a bare `/` matched that file and was *downloaded* instead of rendered. `/` now redirects to `/index`, which is not a file and therefore reaches the dispatcher. Do not remove that redirect.
3. **Anything not ignored under `.vercelignore` becomes a public static asset.** `supabase-schema.sql`, `.env.example` and `composer.json` are excluded for that reason.

The root and `/index.php` are served with `Cache-Control: no-store`: a previously cached copy of the broken static response is what kept `/` failing after the fix shipped. If a change seems not to apply, hard-refresh once — and check that the deployment is built from the latest commit.

#### Vercel's read-only filesystem

Vercel cannot write files, so `data/content.json` and `assets/uploads/` do not persist there. Without Supabase the site shows the seed content and the portal refuses to save, with a message saying why. Connect Supabase (above) and editing, deleting and picture uploads all work normally.

#### Other hosts

On Apache, point a virtual host at the directory, set `AllowOverride All`, and `.htaccess` handles pretty URLs; `DirectoryIndex` is `index.php`.

### What each page is

| File | Page |
| --- | --- |
| `index.php` | Home |
| `student.php` | Student Hub (register / sign in) |
| `dashboard.php` | Signed-in hub — not linked from any menu |
| `executives.php` · `events.php` · `gallery.php` · `about.php` · `contact.php` · `students.php` | Inner pages, all rendered by `includes/page-template.php` |
| `admin.php` | Administrator portal |
| `reset-password.php` | Landing page for the emailed password-reset link |
| `confirm-email.php` | Landing page for the emailed signup confirmation |

### Layout of the code

```
includes/
  functions.php      escaping and link helpers
  content.php        content layer: Supabase, else data/content.json, else seed
  supabase.php       tiny REST client for Supabase (no dependencies)
  seed-content.php   the default content (executives, events, gallery, …)
  pages.php          copy for the inner pages
  head.php           shared <head> + <body>
  header.php         top bar, masthead, nav
  footer.php         footer + scripts
  page-template.php  the inner-page template
  auth.php           server-side admin sign-in
api/
  index.php          Vercel entry point — dispatches every page request
  content.php        read-only JSON for the client-side Student Hub
  admin-content.php  save / delete / upload for the admin portal
  auth-config.php    project URL + publishable key for Supabase Auth (never a secret)
data/
  content.json       created on first request from seed-content.php (gitignored)
assets/uploads/      pictures uploaded through the admin portal
supabase-schema.sql  one-time Supabase setup (table + storage bucket)
```

### Editing content

Content lives in Supabase when it is configured, and in `data/content.json` otherwise; both start from `includes/seed-content.php`, which is created the first time a page is requested. From then on the **Admin Portal** (`admin.php`) is the way to edit it — add, edit, delete and publish executives, events, gallery photos, scholarships and internships, with pictures and links. Changes appear immediately on the public pages, which are rendered on the server.

To reset everything to the shipped content, delete `data/content.json`; it is regenerated from the seed on the next request.

> On Vercel the filesystem is read-only, so connect Supabase (see **Content in Supabase** above) to edit content there.

### Administrator sign-in

The sign-in is verified on the server (`includes/auth.php`), not in JavaScript, and the session cookie is `HttpOnly` / `SameSite=Lax`.

Set these environment variables in production:

```
GOLDHALL_ADMIN_USER=admin
GOLDHALL_ADMIN_PASSWORD=<a long password>
```

If they are unset the old preview login (`admin` / `goldhall`) is used so a fresh checkout works out of the box — **change it before going live.** See `.env.example`.

### Design & animations

Unchanged by the migration, and still in two files included by every page:

- `enhancements.css` — the upgrade layer: richer hover states, shine sweeps, the gold-ring loader, the 3D depth rules and the `prefers-reduced-motion` fallback.
- `fx.js` — the animation engine: scroll reveals, the gold scroll-progress bar, hero entrance, floating particles and cursor-following card tilt. Exposes `window.GoldHallFX.observe(root)`.

## Security notes — still a prototype

The **public site is now server-rendered**, and the content file is protected from direct download by `.htaccess` / `router.php`. The administrator password is no longer in the page source, and writes are checked server-side.

**Student credentials are verified by Supabase Auth** when it is configured: passwords are stored and hashed by Supabase, emails are confirmed before first sign-in, and a recovery link is the only way to reset one. This site never sees a password beyond the request that creates or checks it.

**Everything else in the Student Hub is still a browser-only prototype.** Hall profiles, sessions, grievances and ballots live in `localStorage` / `sessionStorage`:

- Browser storage is not shared between devices and can be edited by the user.
- Access expiry is enforced in the browser, so it can be bypassed.
- A browser-only poll cannot verify that one student cast one vote.

Before using the hub for sensitive student information or a binding election it needs: the grievance and ballot data moved server-side under row-level security, university identity verification on top of Supabase Auth, and server-side access-expiry and duplicate-vote checks with an audit trail.

One Auth-specific caveat worth knowing: sign-up reveals whether an address is already registered (the form says "an account with that email already exists"). That is friendlier than Supabase's default silence, but it does allow account enumeration. Password reset does *not* — it answers identically whether or not the address exists.
