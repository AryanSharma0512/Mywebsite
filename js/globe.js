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
          icon: 'marker'
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
        const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
        const date = typeof imgObj === 'string' ? 'Unknown Date' : imgObj.date;

        const wrapper = document.createElement('div');
        wrapper.className = 'thumb-wrapper';

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('data-lightbox', 'location-images');
        link.setAttribute('data-title', `${location.name} — Captured on ${date}`);

        const thumb = document.createElement('img');
        thumb.src = url;
        thumb.className = 'popup-thumb';

        const caption = document.createElement('div');
        caption.className = 'thumb-caption';
        caption.textContent = `Captured on ${date}`;

        link.appendChild(thumb);
        wrapper.appendChild(link);
        wrapper.appendChild(caption);
        container.appendChild(wrapper);
      });

      modal.style.display = 'flex';
    }

    renderMarkers(cityMarkers); // show cities by default

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
  });
