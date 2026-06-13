export function headerTemplate() {
  return `
    <header id="header-container">
      <div class="header">
        <img src="/imgs/android-chrome-512x512-removebg-preview.png" alt="cosmopulse logo" width="100">
        <div class="logo">COSMO<span>PULSE</span></div>
        <button id="ham-btn" class="hamburger" aria-label="Open navigation menu"></button>
      </div>
    <nav id="nav-bar" class="navigation">
        <ul>
          <li><a href="/index.html" data-page="index">Dashboard</a></li>
                <li><a href="/explore.html" data-page="explore">Explore</a></li>
                <li><a href="/radar.html" data-page="radar">Radar</a></li>
                <li><a href="/favorites.html" data-page="favorites">Favorites</a></li> 
        </ul>
    </nav>
  </header>
  `;
}

export function footerTemplate() {
  return `
    <footer class="footer-container">
        <p>&copy; ${new Date().getFullYear()} CosmoPulse | WDD 330 Final Project</p>
    </footer>
  `;
}

export function loadHeaderFooter() {
  const headerElement = document.getElementById("main-header");
  const footerElement = document.getElementById("main-footer");

  if (headerElement) headerElement.innerHTML = headerTemplate();
  if (footerElement) footerElement.innerHTML = footerTemplate();

  setActiveNavLink();

  enableHamburgerMenu();
}

function setActiveNavLink() {

  const currentPath = window.location.pathname.split("/").pop();

  const pageName = currentPath === "" ? "index" : currentPath.replace(".html", "");

  const navLinks = document.querySelectorAll(".navigation ul a");

  navLinks.forEach(link => {

    if (link.getAttribute("data-page") === pageName) {
      link.classList.add("current"); 
    } else {
      link.classList.remove("current");
    }
  });
}

function enableHamburgerMenu() {
  const navBar = document.querySelector('#nav-bar');
const navButton = document.querySelector('#ham-btn');

navButton.addEventListener('click', () => {
    navButton.classList.toggle('show');
    navBar.classList.toggle('show');
});
}