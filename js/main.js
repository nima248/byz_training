const menuHamburger = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
const body = document.querySelector("body");

menuHamburger.addEventListener("click", (event) => {
  event.stopPropagation();
  navLinks.classList.toggle("show");
});

body.addEventListener("click", (event) => {
  navLinks.classList.remove("show");
});
