// Helper to generate optimized Cloudinary URLs
function getThumbUrl(url, width = 200) {
  // auto format, quality, DPR support
  return url.replace(
    '/upload/',
    `/upload/c_fill,w_${width},dpr_auto,f_auto,q_auto/`
  );
}

function getFullUrl(url, maxWidth = 1200) {
  // limit size to maxWidth, auto format/quality
  return url.replace(
    '/upload/',
    `/upload/c_limit,w_${maxWidth},dpr_auto,f_auto,q_auto/`
  );
}

// Fetch city/place data
fetch('data/locations.json')
  .then(res => res.json())
  .then(data => {
    const cityMarkers = [];
    const placeMarkers = [];

    data.forEach((city) => {
      cityMarkers.push({
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        images: city.places.flatMap(p => p.images).slice(0, 4),
        icon: 'circle'
      });

      city.places.forEach((place, i) => {
        const offset = (i % 2 === 0 ? 1 : -1) * 0.05 * Math.ceil(i / 2);
        placeMarkers.push({
          name: place.name,
          lat: place.lat + offset,
          lng: place.lng + offset,
          images: place.images,
          icon: place.icon || 'marker',
          albumId: place.albumId
        });
      });
    });

    let currentMode = 'city';

    // Tooltip setup
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    document.body.appendChild(tooltip);
    let tooltipTimeout;

    // Initialize globe
    const globe = Globe()(document.getElementById('globeViz'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .onGlobeReady(() => {
        globe.controls().target.set(0, 0, 0);
        globe.camera().position.set(0, 0, 330);
        globe.controls().update();
      });

    // Render HTML markers
    function renderMarkers(dataSet) {
      globe.htmlElementsData(dataSet)
        .htmlLat(d => d.lat)
        .htmlLng(d => d.lng)
        .htmlElement(d => {
          const el = document.createElement('div');
          el.className = d.icon === 'circle' ? 'city-marker' : 'place-marker';
          el.dataset.tooltip = d.name;
          el.onclick = () => showGallery(d);
          el.onmouseenter = () => {
            tooltipTimeout = setTimeout(() => {
              const rect = el.getBoundingClientRect();
              tooltip.textContent = d.name;
              tooltip.style.left = `${rect.left + rect.width/2}px`;
              tooltip.style.top = `${rect.top + 100}px`;
              tooltip.style.opacity = '1';
            }, 300);
          };
          el.onmouseleave = () => {
            clearTimeout(tooltipTimeout);
            tooltip.style.opacity = '0';
          };
          return el;
        });
    }

    // Show up to 4 thumbnails in popup
    function showGallery(location) {
      const modal = document.getElementById('image-popup');
      const container = document.getElementById('popup-gallery');
      const title = document.getElementById('popup-title');

      title.textContent = location.name;
      container.innerHTML = '';

      (location.images || []).forEach(imgObj => {
        const originalUrl = imgObj.url;
        const date = imgObj.date || 'Unknown Date';
        const thumbUrl = getThumbUrl(originalUrl, 200);
        const fullUrl = getFullUrl(originalUrl, 1200);

        const wrapper = document.createElement('div');
        wrapper.className = 'thumb-wrapper';

        const link = document.createElement('a');
        link.href = fullUrl;
        link.setAttribute('data-lightbox', 'location-images');
        link.setAttribute('data-title', `${location.name} — Captured on ${date}`);

        const thumb = document.createElement('img');
        thumb.src = thumbUrl;
        thumb.loading = 'lazy';
        thumb.className = 'popup-thumb';

        const caption = document.createElement('div');
        caption.className = 'thumb-caption';
        caption.textContent = `Captured on ${date}`;

        link.appendChild(thumb);
        wrapper.appendChild(link);
        wrapper.appendChild(caption);
        container.appendChild(wrapper);
      });

      // Full album button
      if (location.albumId) {
        const albumBtn = document.createElement('button');
        albumBtn.textContent = '📸 View full album';
        albumBtn.className = 'view-album-btn';
        albumBtn.onclick = () => openAlbum(location.albumId, location.name);
        container.appendChild(albumBtn);
      }

      modal.style.display = 'flex';
    }

    // Pagination state
    let albumImages = [];
    let currentPage = 0;
    const imagesPerPage = 25;

    // Helper to flip pages with animation
    function flipToPage(newPage) {
      const albumCard = document.querySelector('.album-card');
      // Determine the flip direction.
      if (newPage > currentPage) {
        albumCard.classList.add('flip-next');
      } else {
        albumCard.classList.add('flip-prev');
      }
      albumCard.addEventListener('animationend', () => {
        albumCard.classList.remove('flip-next');
        albumCard.classList.remove('flip-prev');
        currentPage = newPage;
        renderAlbumPage();
      }, { once: true });
    }

    // Fetch and open full album
    function openAlbum(albumId, title) {
      fetch(`data/albums/${albumId}.json?cb=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(images => {
          albumImages = images;
          currentPage = 0;
          document.getElementById('image-popup').style.display = 'none';
          const modal = document.getElementById('album-popup');
          // Ensure card wrapper exists
          if (!modal.querySelector('.album-card')) {
            const card = document.createElement('div');
            card.className = 'album-card';
            const titleEl = document.getElementById('album-title');
            const gridEl = document.getElementById('album-collage');
            const pagEl  = document.getElementById('album-pagination') || document.createElement('div');
            pagEl.id = 'album-pagination'; pagEl.className = 'album-pagination';
            card.appendChild(titleEl);
            card.appendChild(gridEl);
            card.appendChild(pagEl);
            modal.insertBefore(card, modal.querySelector('.close'));
          }
          modal.style.display = 'flex';
          document.getElementById('album-title').textContent = `Full Album — ${title}`;
          console.log(`Loaded ${images.length} images for album ${albumId}`);
          renderAlbumPage();
        })
        .catch(err => alert(`⚠️ Failed to load album: ${err.message}`));
    }

    // Render current page of album
    function renderAlbumPage() {
      const collage = document.getElementById('album-collage');
      collage.innerHTML = '';

      const start = currentPage * imagesPerPage;
      const end = start + imagesPerPage;
      const pageImages = albumImages.slice(start, end);

      pageImages.forEach(img => {
        const a = document.createElement('a');
        const fullUrl = getFullUrl(img.full, 1200);
        a.href = fullUrl;
        a.setAttribute('data-lightbox', 'album-full');
        a.setAttribute('data-title', `Captured on ${img.captured || 'Unknown Date'}`);

        const image = document.createElement('img');
        image.src = img.thumb;
        image.loading = 'lazy';
        image.alt = `Captured on ${img.captured || 'Unknown Date'}`;
        a.appendChild(image);
        collage.appendChild(a);
      });

      renderPaginationControls();
    }

    // Pagination controls
    function renderPaginationControls() {
      let pagination = document.getElementById('album-pagination');
      if (!pagination) {
        pagination = document.createElement('div');
        pagination.id = 'album-pagination';
        pagination.className = 'album-pagination';
        document.getElementById('album-collage').after(pagination);
      }
      pagination.innerHTML = '';

      const totalPages = Math.ceil(albumImages.length / imagesPerPage);

      const prevBtn = document.createElement('button');
      prevBtn.textContent = '<';
      prevBtn.disabled = currentPage === 0;
      prevBtn.onclick = () => { if (currentPage > 0) flipToPage(currentPage - 1); };
      pagination.appendChild(prevBtn);

      const pageIndicator = document.createElement('span');
      pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
      pagination.appendChild(pageIndicator);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = '>';
      nextBtn.disabled = currentPage >= totalPages - 1;
      nextBtn.onclick = () => { if (currentPage < totalPages - 1) flipToPage(currentPage + 1); };
      pagination.appendChild(nextBtn);
    }

    // Initial render
    renderMarkers(cityMarkers);

    // Zoom-based marker switching
    globe.controls().addEventListener('change', () => {
      const zoom = globe.camera().position.length();
      const threshold = 110;
      if (zoom < threshold && currentMode !== 'place') {
        renderMarkers(placeMarkers);
        currentMode = 'place';
      } else if (zoom >= threshold && currentMode !== 'city') {
        renderMarkers(cityMarkers);
        currentMode = 'city';
      }
    });
  })
  .catch(err => console.error('Error loading location data', err));
