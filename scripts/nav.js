document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav").forEach((nav) => {
    const toggle = nav.querySelector(".nav-toggle");
    const links = nav.querySelector(".nav-links");

    if (!toggle || !links) {
      return;
    }

    const openLabel = toggle.getAttribute("aria-label") || "メニューを開く";
    const closeLabel = "メニューを閉じる";

    const setOpen = (isOpen) => {
      nav.classList.toggle("nav--open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.setAttribute("aria-label", isOpen ? closeLabel : openLabel);
    };

    setOpen(false);

    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("nav--open"));
    });

    links.addEventListener("click", (event) => {
      if (event.target.closest(".nav-link")) {
        setOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        setOpen(false);
      }
    });
  });
});
