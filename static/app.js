// Escucha el evento "submit" del formulario de búsqueda
document.querySelector("#searchForm").addEventListener("submit", async (e) => {

  e.preventDefault(); 
  // Evita que el formulario recargue la página al enviarse (comportamiento por defecto)

  const movie = document.querySelector("#movie").value.trim(); 
  // Toma el valor del input, elimina espacios innecesarios

  const resultsDiv = document.querySelector("#results"); 
  // Contenedor donde se van a mostrar los resultados

  if (!movie) return; 
  // Si el usuario envía vacío, no hacemos nada

  // Muestra en pantalla un loader mientras se hace la petición al backend
  resultsDiv.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Buscando "${movie}"...</p>
    </div>
  `;

  try {
    // Llamada al backend usando fetch; se envía la película codificada en la URL
    const res = await fetch(`/buscar?titulo=${encodeURIComponent(movie)}`);

    // Convierte la respuesta del servidor a formato JSON
    const data = await res.json();

    // Si el backend responde con error (por ejemplo, "película no encontrada")
    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:#e50914;">${data.error}</p>`;
      return;
    }

    // Construye el HTML del póster si viene en la respuesta
    const poster = data["🖼️ Póster"]
      ? `<img src="${data["🖼️ Póster"]}" alt="${data["🎬 Título"]}" class="poster">`
      : "";
      // Si no hay póster, queda vacío y no se muestra nada

    // Construye el iframe del tráiler si está disponible
    const trailer = data["🎞️ Tráiler"]
      ? `<iframe src="${data["🎞️ Tráiler"]}" class="trailer" allowfullscreen></iframe>`
      : "";
      // Si no existe, no se renderiza

    // Construye los GIFs; si vienen en array, se recorre y se crea un <img> por cada uno
    const gifs = data["🔥 GIFs"]?.length
      ? `<div class="gifs">${data["🔥 GIFs"].map(g => `<img src="${g}" alt="gif">`).join("")}</div>`
      : "";
      // Si el array está vacío o no existe, se omite

    // Construye la sección de películas similares si existe el array
    const similares = data["🎬 Similares"]?.length
      ? `<div class="similares"><h3>🎬 Películas Similares</h3><p>${data["🎬 Similares"].join(" • ")}</p></div>`
      : "";
      // Las une con un "•" para estética

    // Crea la tarjeta completa con toda la información
    // Recorre cada clave/valor del JSON y genera un párrafo dinámicamente
    let html = `
      <div class="movie-card">
        ${poster}
        <div class="movie-info">
          ${Object.entries(data).map(([k, v]) => {

            // Estos elementos ya se renderizan aparte (póster, trailer, gifs, similares)
            if (["🖼️ Póster", "🎞️ Tráiler", "🔥 GIFs", "🎬 Similares"].includes(k)) return "";

            // Crea una línea con formato: <strong>Etiqueta:</strong> Valor
            return `<p><strong>${k}:</strong> ${v}</p>`;
          }).join("")}
        </div>

        ${trailer}
        ${gifs}
        ${similares}
      </div>
    `;

    // Inserta todo el contenido ya renderizado en la página
    resultsDiv.innerHTML = html;

  } catch (err) {
    // Error general (fallo en fetch, servidor caído, etc.)
    resultsDiv.innerHTML = `<p style="color:#e50914;">Error al conectar con las APIs.</p>`;
  }
});
