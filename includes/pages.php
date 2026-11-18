<?php
/**
 * Static page copy for the inner pages: Executives, Events, Gallery, About,
 * Contact and Student Life. Ported from the old pages.js so the wording,
 * section order and icons are unchanged.
 */

declare(strict_types=1);

/**
 * @return array<string, array<string, mixed>>
 */
function goldhall_pages(): array
{
    return [
        'about' => [
            'nav'     => 'About Us',
            'title'   => 'About Gold Hall',
            'eyebrow' => 'Our Story',
            'intro'   => 'From a decommissioned gold refinery to a home for 250 students on the hills above UMaT, Tarkwa.',
            'sections' => [
                [
                    'id' => 'history', 'title' => 'Our History', 'icon' => 'fa-landmark',
                    'text' => 'Gold Refinery Hall — commonly called Gold Hall — stands at the University of Mines and Technology, Tarkwa. The building began life as a working gold refinery, tied to the mining heritage of the Western Region. In September 2001 the decommissioned refinery was rehabilitated and converted into a hall of residence for UMaT students, and it has housed generations of them ever since.',
                ],
                [
                    'id' => 'capacity', 'title' => 'Capacity & Setting', 'icon' => 'fa-mountain-sun',
                    'text' => 'The hall accommodates approximately 250 students. It stands on elevated ground on the northern outskirts of the UMaT campus, and reaching it means climbing more than 200 stairs — a daily ritual residents proudly call the Gold Hall climb. The reward is one of the quietest and most scenic corners of campus.',
                ],
                [
                    'id' => 'amenities', 'title' => 'Hall Amenities', 'icon' => 'fa-utensils',
                    'text' => 'Like the other UMaT residences, Gold Hall has its own dining hall and kitchen. It also has junior and senior common rooms where residents study, hold meetings, watch football and unwind between lectures.',
                ],
                [
                    'id' => 'mission', 'title' => 'Mission & Vision', 'icon' => 'fa-bullseye',
                    'text' => 'We create a safe, inclusive and inspiring living environment that supports academic excellence and personal growth. We want every resident to leave Gold Hall ready to lead in mining, engineering, technology and beyond.',
                ],
                [
                    'id' => 'values', 'title' => 'Core Values', 'icon' => 'fa-handshake',
                    'text' => 'Excellence, integrity, respect, service and shared responsibility guide how residents treat one another and how the hall is run.',
                ],
            ],
        ],

        'executives' => [
            'nav'     => 'Executives',
            'title'   => 'Hall Executives',
            'eyebrow' => 'Meet the Team',
            'intro'   => 'The executives and tutors who lead Gold Refinery Hall, keep it organised and make sure every resident is heard.',
        ],

        'students' => [
            'nav'     => 'Student Life',
            'title'   => 'Student Life',
            'eyebrow' => 'For Residents',
            'intro'   => 'Everything you need to make the most of your time at Gold Refinery Hall.',
            'sections' => [
                [
                    'id' => 'council', 'title' => 'Student Council', 'icon' => 'fa-people-group',
                    'text' => 'Your elected council plans hall activities, represents resident interests and strengthens our shared community.',
                ],
                [
                    'id' => 'clubs', 'title' => 'Clubs & Societies', 'icon' => 'fa-star',
                    'text' => 'Find opportunities to compete, create, volunteer and connect through our student-led groups.',
                ],
                [
                    'id' => 'support', 'title' => 'Academic Support', 'icon' => 'fa-book-open',
                    'text' => 'Study groups, mentoring and practical resources help residents stay focused and succeed.',
                ],
            ],
        ],

        'events' => [
            'nav'     => 'Events',
            'title'   => 'Hall Events',
            'eyebrow' => 'What’s On',
            'intro'   => 'Hall week, workshops, sports and the gatherings that bring Gold Hall together.',
        ],

        'gallery' => [
            'nav'     => 'Gallery',
            'title'   => 'Photo Gallery',
            'eyebrow' => 'Life at Gold Hall',
            'intro'   => 'A glimpse of the spaces, friendships and moments that shape our community.',
        ],

        'contact' => [
            'nav'     => 'Contact',
            'title'   => 'Contact Us',
            'eyebrow' => 'Get in Touch',
            'intro'   => 'Reach the hall administration for enquiries about residence, events and the Student Hub.',
            'sections' => [
                [
                    'id' => 'address', 'title' => 'Where We Are', 'icon' => 'fa-location-dot',
                    'text' => 'Gold Refinery Hall, University of Mines and Technology, Tarkwa, Western Region, Ghana.',
                ],
                [
                    'id' => 'email', 'title' => 'Email', 'icon' => 'fa-envelope',
                    'text' => 'goldhall@umat.edu.gh — for general enquiries, residence matters and official correspondence.',
                ],
                [
                    'id' => 'hours', 'title' => 'Office Hours', 'icon' => 'fa-clock',
                    'text' => 'Monday to Friday, 8:00 AM – 5:00 PM. The Student Hub is open to residents at any hour.',
                ],
            ],
        ],
    ];
}

/**
 * One page definition, falling back to About.
 *
 * @return array<string, mixed>
 */
function goldhall_page(string $key): array
{
    $pages = goldhall_pages();
    return $pages[$key] ?? $pages['about'];
}

/** The main navigation, identical on every page. */
function goldhall_nav(): array
{
    return [
        ['Home', '', 'fa-house'],
        ['Student Hub', 'student', 'fa-graduation-cap'],
        ['Executives', 'executives', 'fa-users'],
        ['Events', 'events', 'fa-calendar-days'],
        ['Gallery', 'gallery', 'fa-images'],
        ['About Us', 'about', 'fa-landmark'],
    ];
}

/** Extra descriptive copy shown above the card grid, per page. */
function goldhall_page_intro(string $key): array
{
    return [
        'executives' => ['Explore', 'Discover the people, programmes and resources that make Gold Refinery Hall a place to thrive.'],
        'events'     => ['Upcoming Events', 'Everything happening at the hall this term.'],
        'students'   => ['Explore', 'Discover the people, programmes and resources that make Gold Refinery Hall a place to thrive.'],
        'contact'    => ['Explore', 'How to reach the hall administration.'],
    ][$key] ?? ['Explore', 'Discover the people, programmes and resources that make Gold Refinery Hall a place to thrive.'];
}

/** Button text used when a managed item carries a link. */
function goldhall_link_label(string $key): string
{
    return [
        'executives'   => 'Open profile',
        'events'       => 'Event details',
        'gallery'      => 'View',
        'scholarships' => 'Apply',
        'internships'  => 'Apply',
        'students'     => 'Open link',
        'contact'      => 'Open link',
        'about'        => 'Open link',
    ][$key] ?? 'Open link';
}
