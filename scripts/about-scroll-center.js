const targetSectionId = "about-howto";

const centerTargetSection = () => {
  if (window.location.hash !== `#${targetSectionId}`) {
    return;
  }

  const section = document.getElementById(targetSectionId);
  if (!section) {
    return;
  }

  const heading = section.querySelector("h2") || section;
  const header = document.querySelector("header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;

  const rect = heading.getBoundingClientRect();
  const elementTop = rect.top + window.scrollY;
  const elementHeight = rect.height || 0;
  const offset = (window.innerHeight + headerHeight) / 2 - elementHeight / 2;
  const targetScroll = Math.max(0, elementTop - offset);

  window.scrollTo({ top: targetScroll, behavior: "smooth" });
};

window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    centerTargetSection();
  });
});

window.addEventListener("hashchange", () => {
  requestAnimationFrame(() => {
    centerTargetSection();
  });
});
