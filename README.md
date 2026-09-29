# Gold Refinery Hall website

A static website for Gold Refinery Hall, University of Mines and Technology, with a browser-based Student Hub and Administrator Portal prototype.

## Design & animations

Visual polish and motion live in two files included by every page:

- `enhancements.css` – upgrade layer loaded after the page styles: richer hover states, shine sweeps, animated gradients, scroll-reveal rules and a `prefers-reduced-motion` fallback.
- `fx.js` – animation engine: scroll-reveal (`[data-reveal]`), a gold scroll-progress bar, hero entrance synced with the page loader, floating gold particles and gentle card tilt. It exposes `window.GoldHallFX.observe(root)` for JS-rendered views.

## Navigation

The main menu is intentionally short and identical on every page:

**Home · Student Hub · News · Events · Documents · About Us**

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

Open `admin.html` and sign in with the preview admin account:

- Username: `admin`
- Password: `goldhall`

The administrator can:
- **Manage Scholarships & Internships**: Add, edit, delete, publish/unpublish, and link scholarships and internship listings with custom action button labels, application URLs, categories, deadlines, and picture banners.
- **Grievance & Complaint Desk**: Review all submitted complaints, filter by status (Pending, In Progress, Resolved, Closed), category, and priority, search tickets, assign maintenance units / officers, record official action notes, and update student resolution statuses.
- **Manage Website Content**: Add and edit News, Events, Gallery, and Documents with images and link addresses.
- **Student Access & Polls**: Review registered student accounts, mark accounts completed or restore access, configure poll positions and candidates, and toggle election voting.

### Editing content (link + picture)

Every content type (News, Events, Gallery, Documents, Scholarships, Internships) can be edited with:

- **Title, description, category / deadline / eligibility label**
- **Link & Button Label** — the address the card button opens and optional custom button text.
- **Picture** — either **upload a picture from the device** (scaled down to 1280px before storage) **or paste a picture link**. Uploaded pictures are stored in `goldHallManagedContent` in the browser.

## Important security and deployment note

This repository is a static front-end prototype: student records, password hashes, session state, grievances, uploaded pictures and ballots are stored in the browser's `localStorage` / `sessionStorage`. The preview admin password is embedded in client-side JavaScript. Browser storage is not shared between users and can be modified or cleared, and a browser-only poll cannot verify student identity or guarantee one person / one vote. Do not use this implementation for sensitive student information or an official / binding election.

Before production, connect the UI to a secure backend with university identity verification, server-side access expiry / completion status, secure password handling, authorization for the single administrator, and server-side ballot validation, duplicate-vote prevention, audit controls and privacy protections.
