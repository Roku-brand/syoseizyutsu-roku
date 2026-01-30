const updateFooterDate = () => {
  const elements = document.querySelectorAll(".js-last-updated");
  if (!elements.length) {
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const formatted = `${year}/${month}/${day}`;
  const isoDate = `${year}-${month}-${day}`;

  elements.forEach((element) => {
    element.textContent = formatted;
    if (element.tagName.toLowerCase() === "time") {
      element.setAttribute("datetime", isoDate);
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateFooterDate);
} else {
  updateFooterDate();
}
