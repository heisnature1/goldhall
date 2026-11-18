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
- **Picture** — either **upload a picture from the device** (scaled down to 1280px before it is sent) **or paste a picture link**. Uploads go to `assets/uploads/` on the server, validated as real images and renamed; the content itself is saved to `data/content.json`.

## Running it

Requires PHP 8.1 or newer. There are no dependencies and no build step.

```bash
php -S localhost:8000 router.php     # or: composer serve
```

`router.php` mirrors the `.htaccess` rules so pretty URLs (`/about`, `/executives`) work locally. On Apache, point a virtual host at the directory, set `AllowOverride All`, and `.htaccess` handles the rest. `DirectoryIndex` is `index.php`.

### What each page is

| File | Page |
| --- | --- |
| `index.php` | Home |
| `student.php` | Student Hub (register / sign in) |
| `dashboard.php` | Signed-in hub — not linked from any menu |
| `executives.php` · `events.php` · `gallery.php` · `about.php` · `contact.php` · `students.php` | Inner pages, all rendered by `includes/page-template.php` |
| `admin.php` | Administrator portal |

### Layout of the code

```
includes/
  functions.php      escaping and link helpers
  content.php        reads/writes data/content.json
  seed-content.php   the default content (executives, events, gallery, …)
  pages.php          copy for the inner pages
  head.php           shared <head> + <body>
  header.php         top bar, masthead, nav
  footer.php         footer + scripts
  page-template.php  the inner-page template
  auth.php           server-side admin sign-in
api/
  content.php        read-only JSON for the client-side Student Hub
  admin-content.php  save / delete / upload for the admin portal
data/
  content.json       created on first request from seed-content.php (gitignored)
assets/uploads/      pictures uploaded through the admin portal
```

### Editing content

Content lives in `data/content.json` and is created from `includes/seed-content.php` the first time a page is requested. From then on the **Admin Portal** (`admin.php`) is the way to edit it — add, edit, delete and publish executives, events, gallery photos, scholarships and internships, with pictures and links. Changes appear immediately on the public pages, which are rendered from that file.

To reset everything to the shipped content, delete `data/content.json`; it is regenerated from the seed on the next request.

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

The **Student Hub remains a browser-only prototype**. Student accounts, password hashes, sessions, grievances and ballots still live in `localStorage` / `sessionStorage`:

- Browser storage is not shared between devices and can be cleared or edited by the user.
- A browser-only poll cannot verify student identity or guarantee one person / one vote.

Do not use the Student Hub for sensitive student information or an official / binding election. Before production it needs a real database, university identity verification, server-side access-expiry checks, proper password hashing, and server-side ballot validation with duplicate-vote prevention and an audit trail.
