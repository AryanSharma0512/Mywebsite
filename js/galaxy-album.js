let galaxyPhotos = [];
let galaxyIndex = 0;

function openGalaxyAlbum(albumId, title) {
  fetch(`data/albums/${albumId}.json`)
    .then(res => res.json())
    .then(images => {
      galaxyPhotos = images;
      galaxyIndex = 0;
      document.getElementById('galaxy-title').textContent = `Viewing: ${title}`;
      renderGalaxy();
      document.getElementById('album-popup').style.display = 'flex';
    })
    .catch(err => alert("⚠️ Failed to load galaxy album: " + err.message));
}

function closeGalaxyAlbum() {
  document.getElementById('album-popup').style.display = 'none';
}

function scrollGalaxy(dir) {
  galaxyIndex = (galaxyIndex + dir + galaxyPhotos.length) % galaxyPhotos.length;
  renderGalaxy();
}

function renderGalaxy() {
  const ring = document.getElementById('album-collage');
  ring.innerHTML = '';
  const centerX = ring.offsetWidth / 2;
  const centerY = ring.offsetHeight / 2;
  const visible = 20;
  const angleStep = 360 / visible;

  for (let i = -9; i <= 10; i++) {
    let imgIndex = (galaxyIndex + i + galaxyPhotos.length) % galaxyPhotos.length;
    const photo = document.createElement('div');
    photo.className = 'galaxy-photo';
    if (i === 0) photo.classList.add('focused');
    const angle = (i + 9) * angleStep;
    const radius = i === 0 ? 0 : ring.offsetWidth / 2.2;
    const rad = angle * Math.PI / 180;
    const x = centerX + Math.cos(rad) * radius - 40;
    const y = centerY + Math.sin(rad) * radius - 40;

    photo.style.position = 'absolute';
    photo.style.left = `${x}px`;
    photo.style.top = `${y}px`;

    const img = document.createElement('img');
    img.src = galaxyPhotos[imgIndex].thumb;
    img.alt = `Photo ${imgIndex}`;
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.borderRadius = '12px';
    img.onclick = () => window.open(galaxyPhotos[imgIndex].full, '_blank');

    photo.appendChild(img);
    ring.appendChild(photo);
  }
}
