fetch('data/locations.json')
  .then(res => res.json())
  .then(locations => {
    const globe = Globe()(document.getElementById('globeViz'))
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData(locations)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(() => '#ffcc00')
      .pointAltitude(0.01)
      .onGlobeReady(() => {
        globe.controls().target.set(0, 0, 0);
        globe.camera().position.set(0, 0, 330); // 10% farther for better framing
        globe.controls().update();
      })
      .onPointClick(location => {
        const modal = document.getElementById('image-popup');
        const container = document.getElementById('popup-gallery');
        const title = document.getElementById('popup-title');

        title.textContent = location.name;
        container.innerHTML = ''; // Clear previous images

        (location.images || []).forEach(imgObj => {
          // Handle both formats: string or object
          const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
          const date = typeof imgObj === 'string' ? 'Unknown Date' : imgObj.date;

          // Wrapper for thumbnail and caption
          const wrapper = document.createElement('div');
          wrapper.className = 'thumb-wrapper';

          // Lightbox anchor
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('data-lightbox', 'location-images');
          link.setAttribute('data-title', `${location.name} — Captured on ${date}`);

          // Image element
          const thumb = document.createElement('img');
          thumb.src = url;
          thumb.className = 'popup-thumb';

          // Caption under thumbnail
          const caption = document.createElement('div');
          caption.className = 'thumb-caption';
          caption.textContent = `Captured on ${date}`;

          // Assemble
          link.appendChild(thumb);
          wrapper.appendChild(link);
          wrapper.appendChild(caption);
          container.appendChild(wrapper);
        });

        modal.style.display = 'flex';
      });
  });
