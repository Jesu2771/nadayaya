// --- Estado de la Aplicación ---
let albums = ["Todos", "Naturaleza", "Viajes", "Urbano"];
let photos = [
  {
    id: '1',
    title: 'Bosque en la Niebla',
    album: 'Naturaleza',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    filters: resetFilterValues()
  },
  {
    id: '2',
    title: 'Luces de la Ciudad',
    album: 'Urbano',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
    filters: resetFilterValues()
  },
  {
    id: '3',
    title: 'Montañas Nevadas',
    album: 'Viajes',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    filters: resetFilterValues()
  }
];

let activeAlbum = "Todos";
let activePhotoId = null;
let currentFilters = resetFilterValues();

// Cargar almacenamiento local al iniciar
loadFromLocalStorage();

// --- Elementos del DOM ---
const galleryGrid = document.getElementById('gallery-grid');
const albumTabs = document.getElementById('album-tabs');
const searchInput = document.getElementById('search-input');
const photoCount = document.getElementById('photo-count');

// Modales
const editorModal = document.getElementById('editor-modal');
const uploadModal = document.getElementById('upload-modal');
const albumModal = document.getElementById('album-modal');

// Botones Abrir Modales
const btnOpenUpload = document.getElementById('btn-open-upload');
const btnOpenAlbumModal = document.getElementById('btn-open-album-modal');

// Elementos Editor
const editorImage = document.getElementById('editor-image');
const editorTitle = document.getElementById('editor-title');
const editorAlbumTag = document.getElementById('editor-album-tag');

// Controles Deslizadores
const filterSliders = {
  brightness: document.getElementById('filter-brightness'),
  contrast: document.getElementById('filter-contrast'),
  saturate: document.getElementById('filter-saturate'),
  grayscale: document.getElementById('filter-grayscale'),
  sepia: document.getElementById('filter-sepia'),
  blur: document.getElementById('filter-blur'),
  hue: document.getElementById('filter-hue')
};

// --- Funciones Principales ---

function resetFilterValues() {
  return { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0, hue: 0 };
}

function init() {
  renderAlbums();
  renderGallery();
  setupEventListeners();
  if (window.lucide) lucide.createIcons();
}

function saveToLocalStorage() {
  localStorage.setItem('galeria_photos', JSON.stringify(photos));
  localStorage.setItem('galeria_albums', JSON.stringify(albums));
}

function loadFromLocalStorage() {
  const savedPhotos = localStorage.getItem('galeria_photos');
  const savedAlbums = localStorage.getItem('galeria_albums');
  if (savedPhotos) photos = JSON.parse(savedPhotos);
  if (savedAlbums) albums = JSON.parse(savedAlbums);
}

// Renderizar Álbumes
function renderAlbums() {
  albumTabs.innerHTML = '';
  albums.forEach(album => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${album === activeAlbum ? 'active' : ''}`;
    btn.textContent = album;
    btn.onclick = () => {
      activeAlbum = album;
      renderAlbums();
      renderGallery();
    };
    albumTabs.appendChild(btn);
  });

  // Llenar selector en el modal de carga
  const imgAlbumSelect = document.getElementById('img-album');
  imgAlbumSelect.innerHTML = '';
  albums.filter(a => a !== 'Todos').forEach(album => {
    const opt = document.createElement('option');
    opt.value = album;
    opt.textContent = album;
    imgAlbumSelect.appendChild(opt);
  });
}

// Renderizar Galería
function renderGallery() {
  galleryGrid.innerHTML = '';
  const searchVal = searchInput.value.toLowerCase();

  const filteredPhotos = photos.filter(p => {
    const matchesAlbum = activeAlbum === 'Todos' || p.album === activeAlbum;
    const matchesSearch = p.title.toLowerCase().includes(searchVal);
    return matchesAlbum && matchesSearch;
  });

  photoCount.textContent = `Mostrando ${filteredPhotos.length} de ${photos.length} fotos`;

  if (filteredPhotos.length === 0) {
    galleryGrid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="image-off" style="width:48px;height:48px;margin-bottom:1rem;"></i>
        <p>No se encontraron fotos en este álbum.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  filteredPhotos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    const filterStyle = buildFilterString(photo.filters);
    
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${photo.url}" alt="${photo.title}" style="filter: ${filterStyle}">
      </div>
      <div class="card-info">
        <span class="card-title">${photo.title}</span>
        <span class="badge">${photo.album}</span>
      </div>
    `;

    card.onclick = () => openEditor(photo.id);
    galleryGrid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

// Construir cadena de filtro CSS
function buildFilterString(f) {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) grayscale(${f.grayscale}%) sepia(${f.sepia}%) blur(${f.blur}px) hue-rotate(${f.hue}deg)`;
}

// Abrir Editor
function openEditor(id) {
  activePhotoId = id;
  const photo = photos.find(p => p.id === id);
  if (!photo) return;

  editorImage.src = photo.url;
  editorTitle.textContent = photo.title;
  editorAlbumTag.textContent = photo.album;

  currentFilters = { ...photo.filters };
  updateSlidersUI();
  applyFiltersToPreview();

  editorModal.classList.add('active');
}

function updateSlidersUI() {
  for (const key in filterSliders) {
    filterSliders[key].value = currentFilters[key];
    const valDisplay = document.getElementById(`val-${key}`);
    if (valDisplay) {
      const unit = key === 'blur' ? 'px' : key === 'hue' ? '°' : '%';
      valDisplay.textContent = `${currentFilters[key]}${unit}`;
    }
  }
}

function applyFiltersToPreview() {
  editorImage.style.filter = buildFilterString(currentFilters);
}

// Listener de Deslizadores
function setupEventListeners() {
  // Manejo de sliders
  Object.keys(filterSliders).forEach(key => {
    filterSliders[key].addEventListener('input', (e) => {
      currentFilters[key] = e.target.value;
      updateSlidersUI();
      applyFiltersToPreview();
    });
  });

  // Buscar
  searchInput.addEventListener('input', renderGallery);

  // Modales Cierre
  document.getElementById('close-editor').onclick = () => editorModal.classList.remove('active');
  document.getElementById('close-upload').onclick = () => uploadModal.classList.remove('active');
  document.getElementById('close-album-modal').onclick = () => albumModal.classList.remove('active');

  // Modales Abrir
  btnOpenUpload.onclick = () => uploadModal.classList.add('active');
  btnOpenAlbumModal.onclick = () => albumModal.classList.add('active');

  // Guardar Cambios
  document.getElementById('btn-save-filters').onclick = () => {
    const photo = photos.find(p => p.id === activePhotoId);
    if (photo) {
      photo.filters = { ...currentFilters };
      saveToLocalStorage();
      renderGallery();
      editorModal.classList.remove('active');
    }
  };

  // Reiniciar
  document.getElementById('btn-reset-filters').onclick = () => {
    currentFilters = resetFilterValues();
    updateSlidersUI();
    applyFiltersToPreview();
  };

  // Eliminar
  document.getElementById('btn-delete-photo').onclick = () => {
    photos = photos.filter(p => p.id !== activePhotoId);
    saveToLocalStorage();
    renderGallery();
    editorModal.classList.remove('active');
  };

  // Descargar con Canvas
  document.getElementById('btn-download-photo').onclick = downloadImageWithCanvas;

  // Subir Archivo
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  document.getElementById('upload-form').onsubmit = (e) => {
    e.preventDefault();
    const title = document.getElementById('img-title').value;
    const album = document.getElementById('img-album').value;
    const file = fileInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhoto = {
          id: Date.now().toString(),
          title: title,
          album: album,
          url: event.target.result,
          filters: resetFilterValues()
        };
        photos.unshift(newPhoto);
        saveToLocalStorage();
        renderGallery();
        uploadModal.classList.remove('active');
        document.getElementById('upload-form').reset();
      };
      reader.readAsDataURL(file);
    }
  };

  // Crear nuevo Álbum
  document.getElementById('album-form').onsubmit = (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('album-name');
    const newName = nameInput.value.trim();
    if (newName && !albums.includes(newName)) {
      albums.push(newName);
      saveToLocalStorage();
      renderAlbums();
      albumModal.classList.remove('active');
      nameInput.value = '';
    }
  };

  // Presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      const preset = btn.dataset.preset;
      currentFilters = resetFilterValues();
      if (preset === 'vintage') {
        currentFilters.sepia = 50; currentFilters.contrast = 120; currentFilters.brightness = 90;
      } else if (preset === 'bw') {
        currentFilters.grayscale = 100; currentFilters.contrast = 140;
      } else if (preset === 'vivid') {
        currentFilters.saturate = 180; currentFilters.contrast = 110;
      } else if (preset === 'cool') {
        currentFilters.hue = 180; currentFilters.saturate = 120;
      }
      updateSlidersUI();
      applyFiltersToPreview();
    };
  });
}

// Renderizar canvas y descargar imagen procesada
function downloadImageWithCanvas() {
  const photo = photos.find(p => p.id === activePhotoId);
  if (!photo) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = photo.url;

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Aplicar filtros en contexto canvas
    ctx.filter = buildFilterString(currentFilters);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const link = document.createElement('a');
    link.download = `${photo.title.toLowerCase().replace(/\s+/g, '-')}-editada.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', init);