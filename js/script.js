// API
const API_KEY = 'bc45f9930c52f9d61658bb5aee56546e';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// Select
const mainContainer = document.getElementById('main-container');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const genreFilter = document.getElementById('genre-filter');
const yearFilter = document.getElementById('year-filter');
const rateFilter = document.getElementById('rate-filter');
const sortFilter = document.getElementById('sort-filter');
const loadBtn = document.getElementById('load-btn');

let currentPage = 1;
let currentUrl = "";

// initialize theme and page
window.addEventListener('load', () => {
  initTheme();
  if (window.location.pathname.includes('movie.html')) {
    loadMovieDetails();
  } else {
    initHomePage();
  }
});

function initTheme() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) document.body.classList.add('dark-mode');
  if(themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
  }
}

// loaders (geners, years)
async function loadGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const data = await res.json();
  data.genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.id;
    option.innerText = genre.name;
    genreFilter.appendChild(option);
  });
}

function loadYears() {
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= 1980; i--) {
    const option = document.createElement('option');
    option.value = i;
    option.innerText = i;
    yearFilter.appendChild(option);
  }
}

// Movies cards
function showMovies(movies) {
  movies.forEach(movie => {
    const { title, poster_path, vote_average, overview, id } = movie;
    if(!poster_path) return;

    const movieEl = document.createElement('div');
    movieEl.classList.add('movie-card');
    movieEl.innerHTML = 
    `
      <img src="${IMG_URL + poster_path}" alt="${title}">
      <div class="card-overlay">
        <div class="card-title">${title}</div>
        <div class="card-rating">
          <i class="fas fa-star"></i> ${vote_average.toFixed(1)}
        </div>
        <p class="card-overview">${overview ? overview : "No description."}</p>
        <a href="movie.html?id=${id}" class="view-btn">View Details</a>
      </div>
    `;

    mainContainer.appendChild(movieEl);
  });
}

// Fetch movies by pages
async function fetchMovies(url, isLoadMore = false) {
  loadBtn.style.display = 'none';
  try {
    if (!isLoadMore) {
      currentPage = 1;
      currentUrl = url;
      mainContainer.innerHTML = '';
    }
    const res = await fetch(`${url}&page=${currentPage}`);
    const data = await res.json();
    // if no match
    if (data.results.length === 0 && currentPage === 1) {
      mainContainer.innerHTML = 
      `
        <div class="no-results">
          <h2>No Movies Found</h2>
          <p>Try adjusting your filters or search text.</p>
        </div>
      `;
      return;
    }
    showMovies(data.results);
    if (data.results.length > 0) {
      loadBtn.style.display = 'block';
    } 
  } catch (error) {
    console.error("Error fetching data:", error);
    mainContainer.innerHTML = "<h2>Please try again later.</h2>";
  }
}

// Search
function Search() {
  const query = searchInput.value;
  if (query) {
    sessionStorage.setItem('search_query', query);

    sessionStorage.removeItem('filter_genre');
    sessionStorage.removeItem('filter_year');
    sessionStorage.removeItem('filter_rate');

    fetchMovies(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    genreFilter.value = ""; 
    yearFilter.value = "";
    rateFilter.value = "";
  }
}

// Filters
function applyFilters() {
  const genre = genreFilter.value;
  const year = yearFilter.value;
  const rate = rateFilter.value; 
  const sort = sortFilter.value;

  sessionStorage.setItem('filter_genre', genre);
  sessionStorage.setItem('filter_year', year);
  sessionStorage.setItem('filter_rate', rate);
  sessionStorage.setItem('filter_sort', sort);

  sessionStorage.removeItem('search_query');

  let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sort}`;
  if (genre) url += `&with_genres=${genre}`;
  if (year) url += `&primary_release_year=${year}`;
  if (rate) url += `&vote_average.gte=${rate}`;
  fetchMovies(url);
}

// Home page
async function initHomePage() {
  // Load drop menus options
  await loadGenres();
  loadYears();
  // check values in Session (t / f)
  const savedGenre = sessionStorage.getItem('filter_genre');
  const savedYear = sessionStorage.getItem('filter_year');
  const savedRate = sessionStorage.getItem('filter_rate');
  const savedSort = sessionStorage.getItem('filter_sort');
  const savedSearch = sessionStorage.getItem('search_query');
  // Keep choosed options
  if (savedSearch) {
    searchInput.value = savedSearch;
    Search();
  } 
  else if (savedGenre || savedYear || savedRate || savedSort) {
    if(savedGenre) genreFilter.value = savedGenre;
    if(savedYear) yearFilter.value = savedYear;
    if(savedRate) rateFilter.value = savedRate;
    if(savedSort) sortFilter.value = savedSort;
    applyFilters();
  } 
  else {
    fetchMovies(`${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`);
  }

  searchBtn.addEventListener('click', Search);
  searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') Search(); });

  [genreFilter, yearFilter, sortFilter, rateFilter].forEach(el => {
    el.addEventListener('change', applyFilters);
  });

  loadBtn.addEventListener('click', () => {
    currentPage++;
    fetchMovies(currentUrl, true);
  });
}

// Details Page
async function loadMovieDetails() {
  // parsing
  const movieId = new URLSearchParams(window.location.search).get('id');
  const container = document.getElementById('movie-details');
  if (!movieId) return container.innerHTML = "<h2>Movie not found.</h2>";

  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos`);
    const data = await res.json();
    const { title, release_date, runtime, vote_average, overview, poster_path, tagline, genres, credits, videos } = data;
    const year = release_date.split('-')[0];
    const genreList = genres.map(g => `<span>${g.name}</span>`).join('');
    const castList = credits.cast.slice(0, 5).map(c => c.name).join(', ');
    const foundDirector = credits.crew.find(c => c.job === 'Director');
    const director = foundDirector ? foundDirector.name : 'N/A';
    const foundTrailer = videos.results.find(v => v.type === 'Trailer');
    const trailer = foundTrailer ? foundTrailer.key : undefined;

    container.innerHTML = 
    `
      <img src="${poster_path ? IMG_URL + poster_path : 'placeholder.jpg'}" class="details-poster" alt="${title}">
      <div class="details-info">
        <h1>${title} (${year})</h1>
        ${tagline ? `<p class="tagline">"${tagline}"</p>` : ''}
        <div class="genres" style="margin: 10px 0;">${genreList}</div>
        <p><strong>Rating:</strong> <i class="fas fa-star" style="color:#f39c12"></i> ${vote_average.toFixed(1)} / 10.0</p>
        <p><strong>Duration:</strong> ${runtime} mins</p>
        <p><strong>Director:</strong> ${director}</p>
        <p><strong>Cast:</strong> ${castList}</p>
        <h3 style="margin-top: 20px;">Overview</h3>
        <p style="line-height: 1.6;">${overview}</p>
        ${trailer ? `<a href="https://www.youtube.com/watch?v=${trailer}" target="_blank" class="view-btn" style="margin-top:20px; display:inline-block;">Watch Trailer</a>` : ''}
      </div>
    `;
  } catch (error) {
    container.innerHTML = "<h2>Error loading details.</h2>";
    console.error(error);
  }

}
