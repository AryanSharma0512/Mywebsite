// Early browser check before page continues
(function() {
  const cookies = document.cookie.split('; ').reduce((acc, curr) => {
    const [key, val] = curr.split('=');
    acc[key] = val;
    return acc;
  }, {});
  
  if (!cookies.IronGateVerification) {
    window.location.href = 'security.html';
  }
})();

// Trust score and security logic
(function() {
  const cookies = document.cookie.split('; ').reduce((acc, curr) => {
    const [key, val] = curr.split('=');
    acc[key] = val;
    return acc;
  }, {});
  
  // Trust score logic
  const isTrusted = cookies.IronGateVerification?.startsWith('1_') || false;
  const warningCount = parseInt(cookies.SecurityWarning || '0', 10);
  const banTimestamp = parseInt(cookies.TempBanUntil || '0', 10);
  const now = Date.now();
  
  // Check for ban
  if (banTimestamp && now < banTimestamp) {
    location.href = 'security.html';
    return;
  }
  
  // Random screening: ~5% chance
  if (!isTrusted && Math.random() < 0.05) {
    location.href = 'security.html';
    return;
  }
  
  // Suspicious behavior detection
  let refreshCount = 0;
  let touchCount = 0;
  let lastTouch = 0;
  let lastRefresh = sessionStorage.getItem('album_last_refresh') || 0;
  
  // Detect refresh (based on session timestamp)
  if (Date.now() - lastRefresh < 3000) {
    refreshCount = parseInt(sessionStorage.getItem('album_refresh_count') || '0') + 1;
    sessionStorage.setItem('album_refresh_count', refreshCount);
  } else {
    refreshCount = 1;
    sessionStorage.setItem('album_refresh_count', 1);
  }
  sessionStorage.setItem('album_last_refresh', Date.now());
  
  if (refreshCount > 10 && !isTrusted) {
    document.cookie = `SecurityWarning=${warningCount + 1}; path=/; max-age=600; SameSite=Strict`;
    if (warningCount >= 2) {
      document.cookie = `TempBanUntil=${Date.now() + 60000}; path=/; max-age=60; SameSite=Strict`;
    }
    location.href = 'security.html';
    return;
  }
  
  // Detect rapid touch or mousemove events
  document.addEventListener('touchstart', () => {
    const nowTouch = Date.now();
    if (nowTouch - lastTouch < 400) {
      touchCount++;
      if (touchCount > 7 && !isTrusted) {
        document.cookie = `SecurityWarning=${warningCount + 1}; path=/; max-age=600`;
        if (warningCount >= 2) {
          document.cookie = `TempBanUntil=${Date.now() + 60000}; path=/; max-age=60`;
        }
        location.href = 'security.html';
      }
    } else {
      touchCount = 1;
    }
    lastTouch = nowTouch;
  });
})();

// TempBan check on body load
(function() {
  if (document.cookie.includes('TempBanUntil')) {
    document.body.innerHTML = `
      <div style="text-align:center; padding:2rem; font-family:'Inter', sans-serif; background:#111; color:#e0e0e0; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <h1>Temporary Block</h1>
        <p>You've been temporarily blocked for suspicious behavior. Please try again later.</p>
      </div>
    `;
  }
})();

// Navigation toggle event listener
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }
});