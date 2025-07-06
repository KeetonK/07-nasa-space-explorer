// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
// Find the button and gallery elements
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// NASA APOD API endpoint and demo key
const NASA_API_URL = 'https://api.nasa.gov/planetary/apod';
const NASA_API_KEY = 'DEMO_KEY'; // Replace with your own key if needed

// Function to fetch images from NASA API
async function fetchNasaImages(startDate, endDate) {
  // Build the API URL with query parameters
  const url = `${NASA_API_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
  try {
    // Fetch data from the API
    const response = await fetch(url);
    // Parse the JSON response
    const data = await response.json();
    // Return the data (array of image objects)
    return data;
  } catch (error) {
    // If there's an error, log it and return an empty array
    console.error('Error fetching NASA images:', error);
    return [];
  }
}

// Function to create a gallery item element
function createGalleryItem(item) {
  // If it's an image, show the image
  if (item.media_type === 'image') {
    return `
      <div class="gallery-item" 
        data-media_type="image"
        data-url="${item.url}" 
        data-title="${item.title}" 
        data-date="${item.date}" 
        data-explanation="${encodeURIComponent(item.explanation)}">
        <img src="${item.url}" alt="${item.title}" />
        <h3>${item.title}</h3>
        <p>${item.date}</p>
      </div>
    `;
  }
  // If it's a video, handle YouTube and others
  if (item.media_type === 'video') {
    // Check if it's a YouTube video
    const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');
    let videoEmbed = '';
    if (isYouTube) {
      // Extract YouTube video ID
      let videoId = '';
      const ytMatch = item.url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&?/]+)/);
      if (ytMatch) {
        videoId = ytMatch[1];
      }
      if (videoId) {
        videoEmbed = `
          <iframe 
            width="100%" height="200" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" allowfullscreen
            title="${item.title}"></iframe>
        `;
      }
    }
    return `
      <div class="gallery-item" 
        data-media_type="video"
        data-url="${item.url}" 
        data-title="${item.title}" 
        data-date="${item.date}" 
        data-explanation="${encodeURIComponent(item.explanation)}">
        ${videoEmbed ? videoEmbed : `<a href="${item.url}" target="_blank" class="video-link">Watch Video</a>`}
        <h3>${item.title}</h3>
        <p>${item.date}</p>
      </div>
    `;
  }
  // For other media types, skip
  return '';
}

// Function to update the gallery with new images
function updateGallery(items) {
  // If there are no images, show a message
  if (!items || items.length === 0) {
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🔭</div>
        <p>No images found for this date range. Try another range!</p>
      </div>
    `;
    return;
  }
  // Build the gallery HTML by mapping each item to a gallery item
  const galleryHTML = items
    .map(createGalleryItem)
    .join('');
  // Update the gallery element with the new HTML
  gallery.innerHTML = galleryHTML;
}

// Function to show the modal with image or video details
function showModal({ url, title, date, explanation, media_type }) {
  let contentHtml = '';
  if (media_type === 'image') {
    // Show image in modal
    contentHtml = `<img src="${url}" alt="${title}" class="modal-image" />`;
  } else if (media_type === 'video') {
    // Check if it's a YouTube video
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    if (isYouTube) {
      // Extract YouTube video ID
      let videoId = '';
      const ytMatch = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&?/]+)/);
      if (ytMatch) {
        videoId = ytMatch[1];
      }
      if (videoId) {
        contentHtml = `
          <iframe 
            width="100%" height="340" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" allowfullscreen
            title="${title}" class="modal-image"></iframe>
        `;
      }
    } else {
      // For other videos, show a link
      contentHtml = `<a href="${url}" target="_blank" class="video-link">Watch Video</a>`;
    }
  }
  // Create modal HTML
  const modalHtml = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal-content">
        <button class="modal-close" id="modalClose">&times;</button>
        ${contentHtml}
        <h2>${title}</h2>
        <p class="modal-date">${date}</p>
        <p class="modal-explanation">${explanation}</p>
      </div>
    </div>
  `;
  // Add modal to the body
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Close modal when clicking close button or outside modal content
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// Add a click event listener to the button
getImagesButton.addEventListener('click', async () => {
  // Get the selected start and end dates
  const startDate = startInput.value;
  const endDate = endInput.value;
  // Show a loading message
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🚀</div>
      <p>Loading images...</p>
    </div>
  `;
  // Fetch images from NASA API
  const items = await fetchNasaImages(startDate, endDate);
  // Update the gallery with the fetched images
  updateGallery(items);
});

// Add event listener to gallery for modal opening
gallery.addEventListener('click', (event) => {
  // Find the closest gallery-item div
  const itemDiv = event.target.closest('.gallery-item');
  if (!itemDiv) return;
  // Get data attributes from the clicked item
  const url = itemDiv.getAttribute('data-url');
  const title = itemDiv.getAttribute('data-title');
  const date = itemDiv.getAttribute('data-date');
  const explanation = decodeURIComponent(itemDiv.getAttribute('data-explanation'));
  const media_type = itemDiv.getAttribute('data-media_type');
  // Show the modal with the image or video details
  showModal({ url, title, date, explanation, media_type });
});

// Array of fun "Did You Know?" space facts
const spaceFacts = [
  "Did you know? A day on Venus is longer than a year on Venus!",
  "Did you know? Neutron stars can spin at a rate of 600 rotations per second.",
  "Did you know? There are more trees on Earth than stars in the Milky Way.",
  "Did you know? The footprints on the Moon will be there for millions of years.",
  "Did you know? Jupiter has the shortest day of all the planets.",
  "Did you know? One million Earths could fit inside the Sun.",
  "Did you know? Saturn is the only planet that could float in water.",
  "Did you know? Space is completely silent—there is no atmosphere to carry sound.",
  "Did you know? The hottest planet in our solar system is Venus.",
  "Did you know? The largest volcano in the solar system is on Mars—Olympus Mons."
];

// Function to show a random space fact
function showRandomSpaceFact() {
  // Pick a random index
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  // Get the fact
  const fact = spaceFacts[randomIndex];
  // Find the fact container and set its content
  const factDiv = document.getElementById('space-fact');
  if (factDiv) {
    factDiv.textContent = fact;
  }
}

// Show a random fact when the page loads
showRandomSpaceFact();
