document.querySelector("#searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const movie = document.querySelector("#movie").value.trim();
  const resultsDiv = document.querySelector("#results");

  if (!movie) return;

  // Mostrar mensaje de carga animado
  resultsDiv.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Buscando "${movie}"...</p>
    </div>
  `;

  try {
    const res = await fetch(`/buscar?titulo=${encodeURIComponent(movie)}`);
    const data = await res.json();

    // Error (película no encontrada)
    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:#e50914;">${data.error}</p>`;
      return;
    }

    const poster = data["🖼️ Póster"]
      ? `<img src="${data["🖼️ Póster"]}" alt="${data["🎬 Título"]}" class="poster">`
      : "";

    const trailer = data["🎞️ Tráiler"]
      ? `<iframe src="${data["🎞️ Tráiler"]}" class="trailer" allowfullscreen></iframe>`
      : "";

    const gifs = data["🔥 GIFs"]?.length
      ? `<div class="gifs">${data["🔥 GIFs"].map(g => `<img src="${g}" alt="gif">`).join("")}</div>`
      : "";

    const similares = data["🎬 Similares"]?.length
      ? `<div class="similares"><h3>🎬 Películas Similares</h3><p>${data["🎬 Similares"].join(" • ")}</p></div>`
      : "";

    let html = `
      <div class="movie-card">
        ${poster}
        <div class="movie-info">
          ${Object.entries(data).map(([k, v]) => {
            if (["🖼️ Póster", "🎞️ Tráiler", "🔥 GIFs", "🎬 Similares"].includes(k)) return "";
            return `<p><strong>${k}:</strong> ${v}</p>`;
          }).join("")}
        </div>
        ${trailer}
        ${gifs}
        ${similares}
      </div>
    `;

    resultsDiv.innerHTML = html;
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:#e50914;">Error al conectar con las APIs.</p>`;
  }
});
