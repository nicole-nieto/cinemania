from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import requests
from core.config import OMDB_API_KEY, TMDB_API_KEY, GIPHY_API_KEY

app = FastAPI(title="Cinemanía 🎬")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/buscar")
def buscar_pelicula(titulo: str):
    # --- OMDb API ---
    omdb_url = f"http://www.omdbapi.com/?t={titulo}&plot=full&apikey={OMDB_API_KEY}"
    omdb = requests.get(omdb_url).json()

    # --- TMDB API ---
    tmdb_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={titulo}&language=es-ES"
    tmdb_search = requests.get(tmdb_url).json()

    if tmdb_search.get("results"):
        movie_id = tmdb_search["results"][0]["id"]
        tmdb_details_url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&language=es-ES&append_to_response=videos,images,credits,similar"
        tmdb = requests.get(tmdb_details_url).json()
    else:
        tmdb = {}

    # --- Giphy API ---
    giphy_url = f"https://api.giphy.com/v1/gifs/search?api_key={GIPHY_API_KEY}&q={titulo}&limit=3"
    giphy = requests.get(giphy_url).json()
    gif_urls = [gif["images"]["downsized_medium"]["url"] for gif in giphy.get("data", [])]

    # Tráiler
    trailer = None
    if "videos" in tmdb and tmdb["videos"]["results"]:
        for v in tmdb["videos"]["results"]:
            if v["site"] == "YouTube" and v["type"] == "Trailer":
                trailer = f"https://www.youtube.com/embed/{v['key']}"
                break

    # Reparto (máx. 5 actores)
    reparto = []
    if "credits" in tmdb and tmdb["credits"].get("cast"):
        reparto = [a["name"] for a in tmdb["credits"]["cast"][:5]]

    # Películas similares
    similares = []
    if "similar" in tmdb and tmdb["similar"].get("results"):
        similares = [m["title"] for m in tmdb["similar"]["results"][:5]]

    # Formatear presupuesto y recaudación
    def money(value):
        if not value:
            return "No disponible"
        return f"${value:,.0f}".replace(",", ".")

    return {
        "🎬 Título": omdb.get("Title", titulo),
        "📅 Año": omdb.get("Year", "Desconocido"),
        "🎭 Género": omdb.get("Genre", "No disponible"),
        "⏱️ Duración": omdb.get("Runtime", "No disponible"),
        "🎥 Director": omdb.get("Director", "No disponible"),
        "✍️ Guionistas": omdb.get("Writer", "No disponible"),
        "👨‍🎤 Actores": omdb.get("Actors", ", ".join(reparto) if reparto else "No disponible"),
        "🏆 Premios": omdb.get("Awards", "Sin premios registrados"),
        "🌍 País": omdb.get("Country", "No disponible"),
        "🗣️ Idioma": omdb.get("Language", "No disponible"),
        "🏢 Productora": omdb.get("Production", "No disponible"),
        "⭐ IMDb Rating": omdb.get("imdbRating", "N/A"),
        "💯 Metascore": omdb.get("Metascore", "N/A"),
        "📈 Popularidad": tmdb.get("popularity", "No disponible"),
        "🎯 Puntuación TMDB": tmdb.get("vote_average", "N/A"),
        "🗳️ Número de votos": tmdb.get("vote_count", "N/A"),
        "📅 Fecha de estreno": tmdb.get("release_date", "Desconocida"),
        "💰 Presupuesto": money(tmdb.get("budget")),
        "💵 Recaudación": money(tmdb.get("revenue")),
        "📖 Sinopsis": tmdb.get("overview", omdb.get("Plot", "Sin descripción.")),
        "🖼️ Póster": tmdb.get("poster_path") and f"https://image.tmdb.org/t/p/w500{tmdb['poster_path']}",
        "🎞️ Tráiler": trailer,
        "🔥 GIFs": gif_urls,
        "🎬 Similares": similares,
    }
