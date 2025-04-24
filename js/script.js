document.querySelector('.nav-toggle')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('show');
});

document.querySelectorAll('.timeline-image-wrapper').forEach(wrapper => {
  wrapper.addEventListener('mouseenter', () => {
    const img = wrapper.querySelector('img');
    if (!img) return;
    // Clone the image and add the popup class
    const popup = img.cloneNode(true);
    popup.classList.add('popup-image');
    // Determine a position just outside the frame (to the right)
    const rect = wrapper.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = (rect.right + 10) + 'px';
    popup.style.top = rect.top + 'px';
    document.body.appendChild(popup);
    // Trigger the fade in & scale up animation
    requestAnimationFrame(() => {
      popup.style.transform = 'scale(1)';
      popup.style.opacity = '1';
    });
  });
  
  wrapper.addEventListener('mouseleave', () => {
    const popup = document.querySelector('.popup-image');
    if (popup) {
      // Fade out then remove after transition
      popup.style.opacity = '0';
      popup.style.transform = 'scale(0.8)';
      setTimeout(() => popup.remove(), 600);
    }
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