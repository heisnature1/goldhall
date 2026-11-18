<?php
/**
 * Site footer plus the end-of-body scripts.
 *
 * $extra_scripts lets a page add its own scripts before fx.js.
 */

declare(strict_types=1);

$extra_scripts = $extra_scripts ?? [];
?>
<!-- FOOTER -->
<footer class="footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-about">
                <h3>Gold Refinery Hall</h3>
                <p>A prestigious hall of residence at the University of Mines and Technology, Tarkwa. Building leaders, fostering excellence, and creating lasting bonds since 2001.</p>
                <div class="footer-social">
                    <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                    <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                    <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>
            <div class="footer-column">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="about.php"><i class="fas fa-chevron-right"></i> About Us</a></li>
                    <li><a href="executives.php"><i class="fas fa-chevron-right"></i> Executives</a></li>
                    <li><a href="events.php"><i class="fas fa-chevron-right"></i> Events</a></li>
                    <li><a href="gallery.php"><i class="fas fa-chevron-right"></i> Gallery</a></li>
                    <li><a href="student.php"><i class="fas fa-chevron-right"></i> Student Hub</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h4>Resources</h4>
                <ul>
                    <li><a href="student.php"><i class="fas fa-chevron-right"></i> Student Hub</a></li>
                    <li><a href="student.php"><i class="fas fa-chevron-right"></i> Scholarships &amp; internships</a></li>
                    <li><a href="executives.php"><i class="fas fa-chevron-right"></i> Meet the Executives</a></li>
                    <li><a href="gallery.php"><i class="fas fa-chevron-right"></i> Photo Gallery</a></li>
                    <li><a href="events.php"><i class="fas fa-chevron-right"></i> Hall Events</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h4>Contact Us</h4>
                <ul class="footer-contact">
                    <li>
                        <i class="fas fa-map-marker-alt"></i>
                        <span>University of Mines and Technology, Tarkwa, Western Region, Ghana</span>
                    </li>
                    <li>
                        <i class="fas fa-phone"></i>
                        <span>+233 XX XXX XXXX</span>
                    </li>
                    <li>
                        <i class="fas fa-envelope"></i>
                        <span>goldhall@umat.edu.gh</span>
                    </li>
                    <li>
                        <i class="fas fa-clock"></i>
                        <span>Mon - Fri: 8:00 AM - 5:00 PM</span>
                    </li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; <?= date('Y') ?> Gold Refinery Hall, UMaT. All Rights Reserved.</p>
            <div class="footer-bottom-links">
                <a href="about.php">About</a>
                <a href="contact.php">Contact</a>
                <a href="admin.php">Admin</a>
            </div>
        </div>
    </div>
</footer>
<?php foreach ((array) $extra_scripts as $src) : ?>
<script src="<?= goldhall_e($src) ?>"></script>
<?php endforeach; ?>
<script src="fx.js"></script>
</body>
</html>
