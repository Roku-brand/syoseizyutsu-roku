const ignoredRejectionMessages = [
  "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received",
];

const shouldIgnoreRejection = (reason) => {
  if (!reason) {
    return false;
  }
  const message = typeof reason === "string" ? reason : reason.message;
  if (!message) {
    return false;
  }
  return ignoredRejectionMessages.some((text) => message.includes(text));
};

window.addEventListener("unhandledrejection", (event) => {
  if (shouldIgnoreRejection(event.reason)) {
    event.preventDefault();
  }
});

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
