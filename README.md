# Gold Refinery Hall website

A static website for Gold Refinery Hall, University of Mines and Technology, with a browser-based Student Hub prototype.

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
- Programme and year / level
- Room / bedspace and Resident / Non-Resident status
- A password (8 characters minimum)

The Student Hub includes scholarship and internship links, tutorials, a sample campus shuttle timetable, announcements for Freshers Akwaaba and Hall Week, plus free online polls for hall executive positions and the most fashionable freshman / executive. Students at all year levels can register. A student can mark their studies complete in the hub, and the administrator can also mark an account completed; completed accounts are blocked from signing in and voting.

## Preview administrator

Open `admin.html` and sign in with the existing single preview admin account:

- Username: `admin`
- Password: `goldhall`

The admin can continue managing website content, review registered student records, mark accounts completed / restore access, configure poll positions and candidate names, and open or close polls.

### Editing content (link + picture)

Every content type (News, Events, Gallery, Documents) can be edited with:

- **Title, description and a category / date / caption label**
- **Link** — the address the card button opens. Friendly entries such as `example.com/page`
  are stored as `https://example.com/page`; leave it empty to keep the default page link.
- **Picture** — either **upload a picture from the device** (a preview appears immediately,
  the file is scaled down to 1280px before it is stored) **or paste a picture link**. There
  is no picture ID to enter. Uploaded pictures are stored as data URLs inside
  `goldHallManagedContent` in the browser.

Saved items show a thumbnail and the link in the list, and pictures/links flow through to the
home page cards, the Gallery page and the inner pages.

## Important security and deployment note

This repository is a static front-end prototype: student records, password hashes, session state, uploaded pictures and ballots are stored in the browser's `localStorage` / `sessionStorage`. The preview admin password is embedded in client-side JavaScript. Browser storage is not shared between users and can be modified or cleared, and a browser-only poll cannot verify student identity or guarantee one person / one vote. Do not use this implementation for sensitive student information or an official / binding election.

Before production, connect the UI to a secure backend with university identity verification, server-side access expiry / completion status, secure password handling, authorization for the single administrator, and server-side ballot validation, duplicate-vote prevention, audit controls and privacy protections. Scholarship links and the shuttle timetable are sample references and should be verified by the Hall Office. Voting itself does not charge students.
