// Helper to generate optimized Cloudinary URLs
function getThumbUrl(url, width = 200) {
  return url.replace(
    '/upload/',
    `/upload/c_fill,w_${width},dpr_auto,f_auto,q_auto/`
  );
}

function getFullUrl(url, maxWidth = 1200) {
  return url.replace(
    '/upload/',
    `/upload/c_limit,w_${maxWidth},dpr_auto,f_auto,q_auto/`
  );
}

// Helper to generate the high-quality URL by removing Cloudinary transformation parameters.
function getHDUrl(url) {
  return url.replace(/\/upload\/[^/]+\//, '/upload/');
}

// --- Helper functions for cookies ---
function getCookie(name) {
  const cookieArr = document.cookie.split(";");
  for (let i = 0; i < cookieArr.length; i++) {
    let cookiePair = cookieArr[i].split("=");
    if (name.trim() == cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return null;
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const dt = new Date();
    dt.setTime(dt.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + dt.toUTCString();
  }
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

// --- Global flags and timers ---
let isHDLoaded = false;
let showHDButtonTimeout;
let hideHDStatusTimeout;
let currentPhotoIndex = 0;
let photoArray = [];

// Called whenever you change photos
function updatePhotoViewer() {
  const img = document.getElementById('viewer-img');
  const currentUrl = photoArray[currentPhotoIndex];
  const hdUrl = getHDUrl(currentUrl);
  const cookieName = 'hdLoaded_' + hdUrl;

  isHDLoaded = !!getCookie(cookieName);
  const cachedHD = localStorage.getItem('hd_' + hdUrl);
  img.src = isHDLoaded && cachedHD ? cachedHD : currentUrl;

  const hdBtn = document.getElementById('load-hd-btn');
  hdBtn.style.display = "none";
  document.getElementById('hd-status')?.remove();

  clearTimeout(showHDButtonTimeout);
  clearTimeout(hideHDStatusTimeout);

  img.onload = function () {
    if (!isHDLoaded) {
      showHDButtonTimeout = setTimeout(() => {
        if (!isHDLoaded) {
          hdBtn.style.display = "block";
        }
      }, 4000);
    }
  };
}

// Called once the HD image has been loaded
function handleHDLoaded() {
  clearTimeout(showHDButtonTimeout);
  clearTimeout(hideHDStatusTimeout);

  const hdBtn = document.getElementById('load-hd-btn');
  hdBtn.style.display = "none";

  let hdStatus = document.getElementById('hd-status');
  if (hdStatus) {
    hdStatus.remove();
  }

  hdStatus = document.createElement('div');
  hdStatus.id = 'hd-status';
  hdStatus.textContent = "Now viewing in HD quality ✅";
  Object.assign(hdStatus.style, {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    color: '#fff',
    background: 'rgba(0,0,0,0.5)',
    padding: '0.5rem 1rem',
    borderRadius: '4px'
  });
  document.querySelector('.viewer-overlay').appendChild(hdStatus);

  hideHDStatusTimeout = setTimeout(() => {
    hdStatus.remove();
  }, 7000);
}

// Load HD image
function loadHDImage() {
  const imgElement = document.getElementById('viewer-img');
  const currentUrl = photoArray[currentPhotoIndex];
  const hdUrl = getHDUrl(currentUrl);
  const cacheKey = 'hd_' + hdUrl;
  const cookieName = 'hdLoaded_' + hdUrl;

  isHDLoaded = true;
  setCookie(cookieName, "true", 30);

  const hdBtn = document.getElementById('load-hd-btn');
  hdBtn.style.display = "none";

  const cachedHD = localStorage.getItem(cacheKey);
  if (cachedHD) {
    imgElement.src = cachedHD;
    handleHDLoaded();
  } else {
    fetch(hdUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = function () {
          const dataUrl = reader.result;
          localStorage.setItem(cacheKey, dataUrl);
          imgElement.src = dataUrl;
          handleHDLoaded();
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('Error loading HD image', err));
  }
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

    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    document.body.appendChild(tooltip);
    let tooltipTimeout;

    const globe = Globe()(document.getElementById('globeViz'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .onGlobeReady(() => {
        globe.controls().target.set(0, 0, 0);
        globe.camera().position.set(0, 0, 330);
        globe.controls().update();
      });

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
              tooltip.style.left = `${rect.left + rect.width / 2}px`;
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

        thumb.addEventListener('click', (evt) => {
          evt.preventDefault();
          const fullUrls = (location.images || []).map(img => getFullUrl(img.url, 1200));
          const index = fullUrls.findIndex(url => url === fullUrl);
          openPhotoViewer(index, fullUrls);
        });

        link.appendChild(thumb);
        wrapper.appendChild(link);
        wrapper.appendChild(caption);
        container.appendChild(wrapper);
      });

      if (location.albumId) {
        const albumBtn = document.createElement('button');
        albumBtn.textContent = '📸 View full album';
        albumBtn.className = 'view-album-btn';
        albumBtn.onclick = () => openAlbum(location.albumId, location.name);
        container.appendChild(albumBtn);
      }

      modal.style.display = 'flex';
    }

    let albumImages = [];
    let currentPage = 0;
    const imagesPerPage = 25;

    function flipToPage(newPage) {
      const albumCard = document.querySelector('.album-card');
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

    function openAlbum(albumId, title) {
      fetch(`data/albums/${albumId}.json?cb=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(images => {
          albumImages = images;
          currentPage = 0;
          document.getElementById('image-popup').style.display = 'none';
          const modal = document.getElementById('album-popup');
          if (!modal.querySelector('.album-card')) {
            const card = document.createElement('div');
            card.className = 'album-card';
            const titleEl = document.getElementById('album-title');
            const gridEl = document.getElementById('album-collage');
            const pagEl = document.getElementById('album-pagination') || document.createElement('div');
            pagEl.id = 'album-pagination';
            pagEl.className = 'album-pagination';
            card.appendChild(titleEl);
            card.appendChild(gridEl);
            card.appendChild(pagEl);
            modal.insertBefore(card, modal.querySelector('.close'));
          }
          modal.style.display = 'flex';
          document.getElementById('album-title').textContent = `Full Album — ${title}`;
          renderAlbumPage();
        })
        .catch(err => alert(`⚠️ Failed to load album: ${err.message}`));
    }

    function renderAlbumPage() {
      const collage = document.getElementById('album-collage');
      collage.innerHTML = '';

      const start = currentPage * imagesPerPage;
      const end = start + imagesPerPage;
      const pageImages = albumImages.slice(start, end);

      pageImages.forEach((img, idx) => {
        const a = document.createElement('a');
        a.href = "#";

        const image = document.createElement('img');
        image.src = img.thumb;
        image.loading = 'lazy';
        image.alt = `Captured on ${img.captured || 'Unknown Date'}`;

        a.addEventListener('click', (evt) => {
          evt.preventDefault();
          const fullUrls = albumImages.map(item => getFullUrl(item.full, 1200));
          openPhotoViewer(start + idx, fullUrls);
        });

        a.appendChild(image);
        collage.appendChild(a);
      });

      renderPaginationControls();
    }

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

    renderMarkers(cityMarkers);

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

function openPhotoViewer(startIndex, images) {
  currentPhotoIndex = startIndex;
  photoArray = images;
  updatePhotoViewer();
  document.getElementById('photo-viewer').style.display = 'flex';
}

function closePhotoViewer() {
  document.getElementById('photo-viewer').style.display = 'none';
}

function prevPhoto() {
  if (currentPhotoIndex > 0) {
    currentPhotoIndex--;
    updatePhotoViewer();
  }
}

function nextPhoto() {
  if (currentPhotoIndex < photoArray.length - 1) {
    currentPhotoIndex++;
    updatePhotoViewer();
  }
}
