# Gold Refinery Hall website

A static website for Gold Refinery Hall, University of Mines and Technology, with a browser-based Student Hub prototype.

## Student Hub features

Open `student.html` to register or sign in. Registration collects:

- Full name and UMaT Student ID
- Programme and year / level
- Room / bedspace and Resident / Non-Resident status
- A password (8 characters minimum)

The Student Hub includes scholarship and internship links, tutorials, a sample campus shuttle timetable, announcements for Freshers Akwaaba and Hall Week, plus free online polls for hall executive positions and the most fashionable freshman / executive. Students at all year levels can register. A student can mark their studies complete in the hub, and the administrator can also mark an account completed; completed accounts are blocked from signing in and voting.

## Preview administrator

Open `admin.html` and sign in with the existing single preview admin account:

- Username: `admin`
- Password: `goldhall`

The admin can continue managing website content, review registered student records, mark accounts completed / restore access, configure poll positions and candidate names, and open or close polls.

## Important security and deployment note

This repository is a static front-end prototype: student records, password hashes, session state and ballots are stored in the browser's `localStorage` / `sessionStorage`. The preview admin password is embedded in client-side JavaScript. Browser storage is not shared between users and can be modified or cleared, and a browser-only poll cannot verify student identity or guarantee one person / one vote. Do not use this implementation for sensitive student information or an official / binding election.

Before production, connect the UI to a secure backend with university identity verification, server-side access expiry / completion status, secure password handling, authorization for the single administrator, and server-side ballot validation, duplicate-vote prevention, audit controls and privacy protections. Scholarship links and the shuttle timetable are sample references and should be verified by the Hall Office. Voting itself does not charge students.
