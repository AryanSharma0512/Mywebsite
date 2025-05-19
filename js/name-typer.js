// name-typer.js

const names = [
  "Aryan Sharma.",
  "Aryan.",
  "Sharma.",
  "Mr. Sharma."
];

const title = document.querySelector(".hero-title");

let currentIndex = 0;
let isDeleting = false;
let charIndex = 0;
let currentText = '';
let waitTime = 4000;

function getCommonPrefixLength(a, b) {
  let len = 0;
  while (a[len] && b[len] && a[len] === b[len]) {
    len++;
  }
  return len;
}

function typeLoop() {
  const fullText = names[currentIndex];
  const nextIndex = (currentIndex + 1) % names.length;
  const nextText = names[nextIndex];

  const commonPrefixLen = getCommonPrefixLength(fullText, nextText);

  if (!isDeleting) {
    charIndex++;
    currentText = fullText.substring(0, charIndex);
    title.textContent = currentText;

    if (charIndex === fullText.length) {
      isDeleting = true;
      setTimeout(typeLoop, waitTime);
      return;
    }
  } else {
    if (charIndex > commonPrefixLen) {
      charIndex--;
      currentText = fullText.substring(0, charIndex);
      title.textContent = currentText;
    } else {
      isDeleting = false;
      currentIndex = nextIndex;
    }
  }

  const speed = isDeleting ? 60 : 90;
  setTimeout(typeLoop, speed);
}

window.addEventListener("DOMContentLoaded", () => {
  // Only run typing effect on narrow/mobile screens
  if (window.innerWidth <= 768) {
    setTimeout(typeLoop, 4200);
  }
});
