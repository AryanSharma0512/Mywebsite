fetch('data/locations.json')
  .then(res => res.json())
  .then(data => {
    const cityMarkers = [];
    const placeMarkers = [];

    data.forEach((city) => {
      // Add city-level marker
      cityMarkers.push({
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        images: city.places.flatMap(p => p.images).slice(0, 4),
        icon: 'circle'
      });

      // Add place-level markers with slight offsets
      city.places.forEach((place, i) => {
        const offset = (i % 2 === 0 ? 1 : -1) * 0.05 * Math.ceil(i / 2); // simple staggered offset
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

    const globe = Globe()(document.getElementById('globeViz'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .onGlobeReady(() => {
        globe.controls().target.set(0, 0, 0);
        globe.camera().position.set(0, 0, 330);
        globe.controls().update();
      });

    // Initial dataset: city markers
    globe.htmlElementsData(cityMarkers)
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlElement(d => {
        const el = document.createElement('div');
        el.className = d.icon === 'circle' ? 'city-marker' : 'place-marker';
        el.title = d.name;
        el.onclick = () => showGallery(d);
        return el;
      });

    // Function to show the gallery modal
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

    // Zoom threshold logic to switch between city and place markers
    globe.controls().addEventListener('change', () => {
      const zoom = globe.camera().position.length();
      const threshold = 110;

      if (zoom < threshold && currentMode !== 'place') {
        globe.htmlElementsData(placeMarkers);
        currentMode = 'place';
      } else if (zoom >= threshold && currentMode !== 'city') {
        globe.htmlElementsData(cityMarkers);
        currentMode = 'city';
      }
    });
  });
