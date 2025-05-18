// data-dumper.js
const fs        = require('fs');
const path      = require('path');
const cloudinary = require('cloudinary').v2;

// 🔐 Cloudinary credentials
cloudinary.config({
  cloud_name: 'da0nag1rl',
  api_key:    '248635572727319',
  api_secret: '-nyTK0Fteo4BG67br0ofct7igW8'
});

// 📂 Folder path & JSON album name
const albumFolder  = 'photo dump/French museum';
const albumId      = 'french_museum';
const outputDir    = path.join(__dirname, 'data', 'albums');
const outputFile   = path.join(outputDir, `${albumId}.json`);
const capturedDate = '2025-05-17';

// ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

async function fetchAllImages() {
  let allResources = [];
  let nextCursor   = undefined;

  do {
    const result = await cloudinary.search
      .expression(`folder:"${albumFolder}"`)
      .sort_by('public_id', 'asc')
      .max_results(500)          // up to 500 per request
      .next_cursor(nextCursor)   // undefined on first call
      .execute();

    allResources.push(...result.resources);
    nextCursor = result.next_cursor;
    console.log(`Fetched ${allResources.length} / ~? images so far…`);
  } while (nextCursor);

  return allResources;
}

(async () => {
  try {
    const resources = await fetchAllImages();
    console.log(`✅ Total images found: ${resources.length}`);

    const albumJson = resources.map(img => ({
      thumb: cloudinary.url(img.public_id, {
        width: 300,
        crop:  'fill',
        format:'jpg',
        quality: 'auto'
      }),
      full:     img.secure_url,
      captured: capturedDate
    }));

    fs.writeFileSync(outputFile, JSON.stringify(albumJson, null, 2));
    console.log(`🚀 Album JSON written to ${outputFile}`);
  } catch (err) {
    console.error('❌ Error fetching images:', err);
  }
})();
