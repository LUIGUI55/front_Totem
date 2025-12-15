document.addEventListener("DOMContentLoaded", function () {
  loadUserPhotosAndTemplates();

  // Dropdown Menu Logic
  const menuToggle = document.querySelector(".menu-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", function (e) {
      if (!dropdownMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
  }

  // Modal Logic
  const modals = document.querySelectorAll(".modal");
  const closeModalButtons = document.querySelectorAll(".close-modal");
  const modalTriggers = document.querySelectorAll("[data-modal-target]");

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("data-modal-target");
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add("show");
        if (dropdownMenu) dropdownMenu.classList.remove("show"); // Close menu if open
      }
    });
  });

  closeModalButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal");
      if (modal) {
        modal.classList.remove("show");
      }
    });
  });

  window.addEventListener("click", function (e) {
    modals.forEach((modal) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });

  // Carousel Logic (Only if carousel exists on page)
  const carouselInner = document.querySelector(".carousel-inner");
  if (carouselInner) {
    const carouselItems = document.querySelectorAll(".carousel-item");
    const prevButton = document.querySelector(".carousel-control.prev");
    const nextButton = document.querySelector(".carousel-control.next");
    let currentIndex = 0;

    function updateCarousel() {
      carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        currentIndex =
          currentIndex > 0 ? currentIndex - 1 : carouselItems.length - 1;
        updateCarousel();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        currentIndex =
          currentIndex < carouselItems.length - 1 ? currentIndex + 1 : 0;
        updateCarousel();
      });
    }

    // Auto advance
    setInterval(function () {
      currentIndex =
        currentIndex < carouselItems.length - 1 ? currentIndex + 1 : 0;
      updateCarousel();
    }, 5000);
  }
});

function checkUrlForToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("access_token"); // Asumo que tu API devuelve el token en un parámetro llamado 'token'

  if (token) {
    // Token encontrado. Procede a guardar y redirigir
    localStorage.setItem("accessToken", token);

    // Limpia la URL para que el token no quede expuesto en el historial
    window.history.replaceState({}, document.title, window.location.pathname);

    // Redirige al contenido protegido
    window.location.href = "photos.html";
    return true; // Token encontrado y manejado
  }
  return false; // No se encontró token
}

checkUrlForToken();

const API_BASE_URL = "https://totem.itsfdavid.com";
let integratedImages = []; // Almacenará las imágenes integradas para el carrusel
let currentCarouselIndex = 0;

// 1. AUTENTICACIÓN: Verificar Token
function checkAuthentication() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    // Si no hay token, redirige al login
    window.location.href = "index.html";
    return null;
  }
  return token;
}

// 2. CARGA DE DATOS: Llamada Genérica a la API
async function fetchData(endpoint) {
  const token = checkAuthentication();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return await response.json();
    } else if (response.status === 401) {
      // Token expirado o inválido: forzar re-login
      localStorage.removeItem("accessToken");
      window.location.href = "index.html";
      return null;
    } else {
      console.error(
        `Error al obtener ${endpoint}:`,
        response.status,
        response.statusText
      );
      return [];
    }
  } catch (error) {
    console.error("Error de red al obtener datos:", error);
    return [];
  }
}

// 3. RENDERIZADO: Imágenes Integradas (Carrusel)
function renderIntegratedImages(images) {
  integratedImages = images;
  const carouselInner = document.getElementById("carousel-inner");
  const integratedEmpty = document.getElementById("integrated-empty");
  const carousel = document.getElementById("integrated-carousel");

  carouselInner.innerHTML = "";

  if (images.length === 0) {
    integratedEmpty.style.display = "block";
    carousel.style.display = "block"; // Muestra el contenedor
    return;
  }

  integratedEmpty.style.display = "none";

  images.forEach((img, index) => {
    const item = document.createElement("div");
    item.className = "carousel-item";
    // Aseguramos que solo el primer elemento esté activo inicialmente
    if (index === 0) {
      item.classList.add("active");
    }
    item.innerHTML = `<img src="${img.url}" alt="Imagen Integrada ${
      index + 1
    }">`;
    carouselInner.appendChild(item);
  });

  // Inicializar Carrusel
  setupCarousel();
}

// Lógica para mover el carrusel
function setupCarousel() {
  const items = document.querySelectorAll("#carousel-inner .carousel-item");
  const inner = document.getElementById("carousel-inner");

  // Ocultar controles si solo hay una imagen
  const prevButton = document.querySelector(".carousel-control.prev");
  const nextButton = document.querySelector(".carousel-control.next");
  if (items.length <= 1) {
    if (prevButton) prevButton.style.display = "none";
    if (nextButton) nextButton.style.display = "none";
    return;
  } else {
    if (prevButton) prevButton.style.display = "block";
    if (nextButton) nextButton.style.display = "block";
  }

  function updateCarousel() {
    // Aplicar la transformación de desplazamiento
    inner.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;

    // Actualizar la clase 'active' (opcional, si se usa para estilos)
    items.forEach((item, index) => {
      item.classList.remove("active");
      if (index === currentCarouselIndex) {
        item.classList.add("active");
      }
    });
  }

  // Manejadores de eventos
  prevButton.onclick = () => {
    currentCarouselIndex =
      currentCarouselIndex > 0 ? currentCarouselIndex - 1 : items.length - 1;
    updateCarousel();
  };

  nextButton.onclick = () => {
    currentCarouselIndex =
      currentCarouselIndex < items.length - 1 ? currentCarouselIndex + 1 : 0;
    updateCarousel();
  };

  // Asegurarse de que el carrusel se inicializa en el estado correcto
  updateCarousel();
}

// 4. RENDERIZADO: Plantillas (Grid Dinámico)
function renderTemplates(templates) {
  const templatesGrid = document.getElementById("templates-grid");
  const templatesEmpty = document.getElementById("templates-empty");

  templatesGrid.innerHTML = "";

  if (templates.length === 0) {
    templatesEmpty.style.display = "block";
    templatesGrid.style.display = "none";
    return;
  }

  templatesEmpty.style.display = "none";
  templatesGrid.style.display = "grid"; // Asegura que el grid esté visible

  templates.forEach((template, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item template-item"; // Agrega una clase específica para estilos de template
    item.innerHTML = `
                    <img src="${template.url}" alt="Template ${index + 1}">
                    <div class="gallery-item-actions">
                        <button onclick="viewTemplate('${template.uuid}', '${
      template.url
    }')" title="Ver plantilla"><i class="fas fa-eye"></i></button>
                        <button title="Usar plantilla"><i class="fas fa-magic"></i></button>
                    </div>
                `;
    templatesGrid.appendChild(item);
  });
}

// 5. FUNCIÓN PRINCIPAL DE CARGA
async function loadUserPhotosAndTemplates() {
  // Lógica para imágenes integradas (Carrusel)
  const integratedData = await fetchData("/templates/my-with-images");
  if (integratedData) {
    renderIntegratedImages(integratedData);
  }

  // Lógica para plantillas (Grid)
  const templatesData = await fetchData("/templates/my");
  if (templatesData) {
    renderTemplates(templatesData);
  }
}

// 6. Funciones de Acciones (View, etc.)
function viewTemplate(uuid, url) {
  const viewer = document.getElementById("photo-viewer");
  const img = document.getElementById("viewer-image");
  img.src = url;
  viewer.classList.add("show");
}

// Cierre del visor
document
  .querySelector(".photo-viewer-close")
  .addEventListener("click", function () {
    document.getElementById("photo-viewer").classList.remove("show");
  });

document.getElementById("photo-viewer").addEventListener("click", function (e) {
  if (e.target === this) {
    this.classList.remove("show");
  }
});
