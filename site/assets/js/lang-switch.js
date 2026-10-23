"use strict";
/* Preserve the selected section when switching languages. */
document.querySelectorAll(".language-switch a[hreflang]").forEach(link => {
  link.addEventListener("click", () => {
    if (window.location.hash) link.hash = window.location.hash;
  });
});
