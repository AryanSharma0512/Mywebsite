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