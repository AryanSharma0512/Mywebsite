document.addEventListener('DOMContentLoaded', () => {
  const hint = document.getElementById('scrollHint');
  const legend = document.getElementById('legend');

  if (!hint) return;

  const eraseText = () => {
    const text = hint.textContent;
    let index = text.length;

    const interval = setInterval(() => {
      if (index <= 0) {
        clearInterval(interval);
        hint.style.transition = 'opacity 0.5s ease';
        hint.style.opacity = '0';
        setTimeout(() => {
          hint.style.display = 'none';
        }, 500);
        return;
      }
      hint.textContent = text.slice(0, --index);
    }, 50); // adjust speed here
  };

  // Hide after 10 seconds
  const timer = setTimeout(eraseText, 8500);

  // Hide immediately on scroll or legend visible
  const instantHide = () => {
    clearTimeout(timer);
    eraseText();
  };

  window.addEventListener('scroll', instantHide, { once: true });

  if (legend) {
    const observer = new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        instantHide();
        obs.disconnect();
      }
    }, { threshold: 0.2 });

    observer.observe(legend);
  }
});
