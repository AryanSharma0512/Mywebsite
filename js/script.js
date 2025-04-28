document.querySelector('.nav-toggle')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('show');
});

document.querySelectorAll('.timeline-image-wrapper').forEach(wrapper => {
  let popup = null;
  let fadeTimeout = null;

  wrapper.addEventListener('mouseenter', () => {
    // if a previous popup still exists, remove it immediately
    if (popup) {
      clearTimeout(fadeTimeout);
      popup.remove();
      popup = null;
    }

    const img = wrapper.querySelector('img');
    if (!img) return;

    // clone & style
    popup = img.cloneNode(true);
    popup.classList.add('popup-image');
    popup.style.position = 'fixed';
    const rect = wrapper.getBoundingClientRect();
    popup.style.left = (rect.right + 10) + 'px';
    popup.style.top  = rect.top + 'px';
    popup.style.opacity = '0';
    popup.style.transform = 'scale(0.8)';
    document.body.appendChild(popup);

    // fade in
    requestAnimationFrame(() => {
      popup.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
      popup.style.transform = 'scale(1)';
      popup.style.opacity = '1';
    });
  });

  wrapper.addEventListener('mouseleave', () => {
    if (!popup) return;

    // fade out
    popup.style.transform = 'scale(0.8)';
    popup.style.opacity   = '0';

    // remove after our CSS transition duration (0.6s)
    fadeTimeout = setTimeout(() => {
      if (popup) {
        popup.remove();
        popup = null;
      }
    }, 600);
  });
  
  // New: On click, show modal with full image
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    const img = wrapper.querySelector('img');
    if (!img) return;
    
    // Create the modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('modal-overlay');
    
    // Create the modal content container
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    
    // Clone the image (full version) for the modal
    const modalImg = img.cloneNode(true);
    modalImg.style.width = '100%';
    modalImg.style.height = 'auto';
    modalContent.appendChild(modalImg);
    
    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('modal-close');
    modalContent.appendChild(closeButton);
    
    // Append modal content to overlay
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Force a reflow and then add the active class to trigger fade in
    requestAnimationFrame(() => {
      modalOverlay.classList.add('active');
    });
    
    // Close modal when clicking on close button or overlay
    const removeModal = () => {
      modalOverlay.classList.remove('active');
      setTimeout(() => modalOverlay.remove(), 300);
    };
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      removeModal();
    });
    
    modalOverlay.addEventListener('click', removeModal);
    // Prevent clicks in the modal content from closing the modal
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
});

// Modal for project images in resume.html
document.querySelectorAll('.projects .project-img img').forEach(img => {
  img.addEventListener('click', () => {
    // Create modal overlay element
    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('modal-overlay');

    // Create modal content element
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    // Clone the clicked image for enlargement
    const modalImg = img.cloneNode(true);
    modalImg.style.width = '100%';
    let zoomLevel = 1; // initial scale

    modalContent.appendChild(modalImg);

    // Add double-click zoom event to the modal image
    modalImg.addEventListener('dblclick', function(e) {
      const rect = modalImg.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      // Calculate the click position as percentages
      const originX = (offsetX / rect.width) * 100;
      const originY = (offsetY / rect.height) * 100;
      modalImg.style.transformOrigin = originX + '% ' + originY + '%';

      // Toggle between zoomed in (scale 2) and original view (scale 1)
      zoomLevel = (zoomLevel === 1) ? 2 : 1;
      modalImg.style.transform = `scale(${zoomLevel})`;
    });

    // Create and append the close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('modal-close');
    modalContent.appendChild(closeButton);

    // Append modal content to overlay and overlay to body
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Trigger fade-in by adding active class after a short delay
    setTimeout(() => {
      modalOverlay.classList.add('active');
    }, 10);

    // Remove modal when clicking the close button
    closeButton.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      setTimeout(() => modalOverlay.remove(), 300);
    });

    // Also remove modal if the user clicks outside the modal content
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        setTimeout(() => modalOverlay.remove(), 300);
      }
    });
  });
});

// Tap to open & double-tap to zoom for framed-photo images
document.querySelectorAll('.framed-photo img').forEach(img => {
  img.addEventListener('click', (e) => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'modal-content';

    // Clone the image
    const modalImg = img.cloneNode();
    modalImg.style.transform = 'scale(1)';
    modalImg.dataset.zoomed = 'false';

    // Double-tap / double-click zoom handler
    modalImg.addEventListener('dblclick', (ev) => {
      const zoomed = modalImg.dataset.zoomed === 'true';
      if (!zoomed) {
        // calculate click position within image
        const rect = modalImg.getBoundingClientRect();
        const offsetX = ev.clientX - rect.left;
        const offsetY = ev.clientY - rect.top;
        const originX = (offsetX / rect.width) * 100;
        const originY = (offsetY / rect.height) * 100;
        modalImg.style.transformOrigin = `${originX}% ${originY}%`;
        modalImg.style.transform = 'scale(2)';
        modalImg.dataset.zoomed = 'true';
        modalImg.style.cursor = 'zoom-out';
      } else {
        modalImg.style.transform = 'scale(1)';
        modalImg.dataset.zoomed = 'false';
        modalImg.style.cursor = 'zoom-in';
      }
    });

    // Close button
    const close = document.createElement('button');
    close.className = 'modal-close';
    close.textContent = '×';
    close.addEventListener('click', () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    });

    // Clicking outside content also closes
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) {
        close.click();
      }
    });

    // Assemble & show
    content.appendChild(modalImg);
    content.appendChild(close);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Force reflow then fade in
    requestAnimationFrame(() => overlay.classList.add('active'));
  });
});

// FOCUS MODE — blur siblings & show caption to the right

// FOCUS + DYNAMIC CAPTION + CLICK-TO-MODAL
const albumPage = document.querySelector('.album-page');
document.querySelectorAll('.album-frame').forEach(frame => {
  const caption = frame.querySelector('.frame-caption');
  const media = frame.querySelector('img, video');

  frame.addEventListener('mouseenter', () => {
    // focus mode
    albumPage.classList.add('frame-focused');
    frame.classList.add('focused');

    // dynamic caption side
    const rect = frame.getBoundingClientRect();
    caption.classList.remove('caption-left', 'caption-right');
    if (rect.left > window.innerWidth / 2) {
      caption.classList.add('caption-left');
    } else {
      caption.classList.add('caption-right');
    }
  });

  frame.addEventListener('mouseleave', () => {
    // exit focus
    albumPage.classList.remove('frame-focused');
    frame.classList.remove('focused');
    caption.classList.remove('caption-left', 'caption-right');
  });

  frame.addEventListener('click', () => {
    // only trigger if this frame is focused
    if (!frame.classList.contains('focused')) return;

    // build modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';

    // clone the media (img or video)
    const clone = media.cloneNode(true);
    clone.removeAttribute('class'); 
    content.appendChild(clone);

    // close button
    const close = document.createElement('button');
    close.className = 'modal-close';
    close.textContent = '×';
    close.addEventListener('click', () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    });
    content.appendChild(close);

    overlay.appendChild(content);
    document.body.appendChild(overlay);
    // fade in
    requestAnimationFrame(() => overlay.classList.add('active'));

    // click outside content to close
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close.click();
    });
  });
});
