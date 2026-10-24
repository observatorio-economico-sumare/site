"use strict";
(() => {
  const menu = document.querySelector(".nav-inner");
  const shell = document.querySelector(".nav-shell");
  if (!menu || !shell) return;
  const update = () => {
    const remaining = menu.scrollWidth - menu.clientWidth - menu.scrollLeft;
    shell.classList.toggle("nav-more-right", remaining > 4);
  };
  menu.addEventListener("scroll", update, {passive: true});
  window.addEventListener("resize", update);
  update();
})();
