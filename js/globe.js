// Cloudinary URL Helpers
function getThumbUrl(url, width = 200) {
  return url ? url.replace('/upload/', `/upload/c_fill,w_${width},dpr_auto,f_auto,q_auto/`) : '';
}

function getFullUrl(url, maxWidth = 1200) {
  return url ? url.replace('/upload/', `/upload/c_limit,w_${maxWidth},dpr_auto,f_auto,q_auto/`) : '';
}

// Cookie Management
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=');
    if (cookieName.trim() === name) return cookieValue;
  }
  return null;
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 86400000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

// Global State
const HD_COOKIE_PREFIX = 'hd_loaded_';
let currentPhotoIndex = 0;
let photoArray = [];
let showHDButtonTimeout;
let hideHDStatusTimeout;
let albumImages = [];
let currentPage = 0;
const imagesPerPage = 25;

// Photo Viewer Functions
function updatePhotoViewer() {
  const img = document.getElementById('viewer-img');
  const currentUrl = photoArray[currentPhotoIndex];
  const hdCookieName = HD_COOKIE_PREFIX + btoa(currentUrl);

  // Reset display
  const loadHDButton = document.getElementById('load-hd-btn');
  if (loadHDButton) {
    loadHDButton.style.display = 'none';
  }
  const hdStatusElement = document.getElementById('hd-status');
  if (hdStatusElement) {
    hdStatusElement.remove();
  }
  clearTimeout(showHDButtonTimeout);
  clearTimeout(hideHDStatusTimeout);

  const isHDLoaded = getCookie(hdCookieName) === 'true';
  const cacheKey = 'hd_' + currentUrl;
  const cachedHD = localStorage.getItem(cacheKey);

  if (isHDLoaded && cachedHD) {
    img.onload = null;
    img.src = cachedHD;
  } else {
    img.onload = function () {
      if (!isHDLoaded) {
        showHDButtonTimeout = setTimeout(() => {
          const loadHDButtonInner = document.getElementById('load-hd-btn');
          if (loadHDButtonInner) {
            loadHDButtonInner.style.display = 'block';
          }
        }, 4000);
      }
    };
    img.src = getFullUrl(currentUrl);
  }
}

function handleHDLoaded(url) {
  clearTimeout(showHDButtonTimeout);
  clearTimeout(hideHDStatusTimeout);
  const loadHDButton = document.getElementById('load-hd-btn');
  if (loadHDButton) {
    loadHDButton.style.display = 'none';
  }
  setCookie(HD_COOKIE_PREFIX + btoa(url), 'true', 365);

  const hdStatus = document.createElement('div');
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
  const viewerOverlay = document.querySelector('.viewer-overlay');
  if (viewerOverlay) {
    viewerOverlay.appendChild(hdStatus);
  }
  hideHDStatusTimeout = setTimeout(() => {
    const hdStatusToRemove = document.getElementById('hd-status');
    if (hdStatusToRemove) {
      hdStatusToRemove.remove();
    }
  }, 7000);
}

function loadHDImage() {
  const imgElement = document.getElementById('viewer-img');
  const currentUrl = photoArray[currentPhotoIndex];
  const cacheKey = 'hd_' + currentUrl;

  setCookie(HD_COOKIE_PREFIX + btoa(currentUrl), 'true', 365);
  const loadHDButton = document.getElementById('load-hd-btn');
  if (loadHDButton) {
    loadHDButton.style.display = 'none';
  }

  const cachedHD = localStorage.getItem(cacheKey);
  if (cachedHD) {
    imgElement.onload = null;
    imgElement.src = cachedHD;
    handleHDLoaded(currentUrl);
    return;
  }

  // Add blur and loading text
  imgElement.style.filter = 'blur(5px)';
  const loadingText = document.createElement('div');
  loadingText.id = 'loading-text';
  loadingText.textContent = 'Image is loading...';
  Object.assign(loadingText.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    zIndex: 10,
    pointerEvents: 'none',
  });
  const viewerOverlay = document.querySelector('.viewer-overlay');
  if (viewerOverlay) {
    viewerOverlay.appendChild(loadingText);
  }

  // Fetch the raw HD image
  fetch(currentUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.blob();
    })
    .then(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        localStorage.setItem(cacheKey, dataUrl);
        imgElement.onload = () => {
          imgElement.style.filter = '';
          const loadingTextElement = document.getElementById('loading-text');
          if (loadingTextElement) {
            loadingTextElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            loadingTextElement.style.opacity = '0';
            loadingTextElement.style.transform = 'translate(-50%, -80%)';
            setTimeout(() => {
              loadingTextElement.remove();
              handleHDLoaded(currentUrl);
            }, 500);
          } else {
            handleHDLoaded(currentUrl);
          }
        };
        imgElement.src = '';
        setTimeout(() => {
          imgElement.src = dataUrl;
        }, 100);
      };
      reader.readAsDataURL(blob);
    })
    .catch(err => {
      console.error('HD image load failed:', err);
      imgElement.src = getFullUrl(currentUrl);
    });
}

// Viewer Controls
function openPhotoViewer(startIndex, images) {
  currentPhotoIndex = startIndex;
  photoArray = images.map(img => img.full || img);
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

    const globeViz = document.getElementById('globeViz');
    if (globeViz) {
      const globe = Globe()(globeViz)
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

        if (title) {
          title.textContent = location.name;
        }
        if (container) {
          container.innerHTML = '';

          (location.images || []).forEach(imgObj => {
            const originalUrl = imgObj.url;
            const date = imgObj.date || 'Unknown Date';
            const thumbUrl = getThumbUrl(originalUrl, 200);
            const fullUrl = imgObj.full || getFullUrl(originalUrl);

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
              const fullUrls = (location.images || []).map(img => img.full || getFullUrl(img.url)); 
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
        }

        if (modal) {
          modal.style.display = 'flex';
        }
      }

      function flipToPage(newPage) {
        const albumCard = document.querySelector('.album-card');
        if (albumCard) {
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
      }

      function openAlbum(albumId, title) {
        fetch(`data/albums/${albumId}.json?cb=${Date.now()}`, { cache: 'no-store' })
          .then(res => res.json())
          .then(images => {
            albumImages = images;
            currentPage = 0;
            document.getElementById('image-popup').style.display = 'none';
            const modal = document.getElementById('album-popup');
            if (modal) {
              let card = modal.querySelector('.album-card');
              if (!card) {
                card = document.createElement('div');
                card.className = 'album-card';
                const titleEl = document.getElementById('album-title');
                const gridEl = document.getElementById('album-collage');
                let pagEl = document.getElementById('album-pagination');
                if (!pagEl) {
                  pagEl = document.createElement('div');
                  pagEl.id = 'album-pagination';
                  pagEl.className = 'album-pagination';
                }
                if (titleEl) card.appendChild(titleEl);
                if (gridEl) card.appendChild(gridEl);
                card.appendChild(pagEl);
                modal.insertBefore(card, modal.querySelector('.close'));
              }
              modal.style.display = 'flex';
              const albumTitle = document.getElementById('album-title');
              if (albumTitle) {
                albumTitle.textContent = `Full Album — ${title}`;
              }
              renderAlbumPage();
            }
          })
          .catch(err => alert(`⚠️ Failed to load album: ${err.message}`));
      }

      function renderAlbumPage() {
        const collage = document.getElementById('album-collage');
        if (collage) {
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
              const fullUrls = albumImages.map(item => item.full);
              openPhotoViewer(start + idx, fullUrls);
            });

            a.appendChild(image);
            collage.appendChild(a);
          });
        }

        renderPaginationControls();
      }

      function renderPaginationControls() {
        let pagination = document.getElementById('album-pagination');
        const collageElement = document.getElementById('album-collage');
        if (!pagination && collageElement) {
          pagination = document.createElement('div');
          pagination.id = 'album-pagination';
          pagination.className = 'album-pagination';
          collageElement.after(pagination);
        }
        if (pagination) {
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
    }
  })
  .catch(err => console.error('Error loading location data', err));
