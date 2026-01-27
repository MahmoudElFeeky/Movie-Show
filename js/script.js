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
const resetBtn = document.getElementById('reset-btn');
const loadBtn = document.getElementById('load-btn');

let currentPage = 1;
let currentUrl = "";

// initialize theme and page
window.addEventListener('load', () => {
  initTheme();
  calccount();
  if (window.location.pathname.includes('movie.html')) {
    loadMovieDetails();
  } 
  else if(window.location.pathname.includes('fav.html')){
    initFav();
  }  
  else{
    initHomePage();
  }
});
function calccount()
{
  let count = localStorage.getItem("count");
  if(count==null)
  {
    count=0;
    localStorage.setItem("count",JSON.stringify(count));
  }else{
    count = JSON.parse(count);
  }
  let favcount = document.getElementById("favCount");
  favcount.textContent = count;

}
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
  let items = localStorage.getItem("fav");
  if(items!= null && items.length!= 0)
  {
    items = JSON.parse(items);
  }else
  {
    items = [];
  }
  movies.forEach(movie => {
    const { title, poster_path, vote_average, overview, id } = movie;
    if(!poster_path) return;

    const movieEl = document.createElement('div');
    movieEl.classList.add('movie-card');
    movieEl.id=id;
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
        <button id ="add${id}" style="border :none ;display:${items.includes(id)?"none":"block"}" onclick="addtofav(${id})" class="view-btn">Add to favourites</button>
        <button id ="remove${id}" style="border :none ;display:${items.includes(id)?"block":"none"}" onclick="removeformfav(${id})" class="view-btn">remove from favourites</button>


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

function resetFilters() {
  // Clear all and return def
  searchInput.value = "";
  genreFilter.value = "";
  yearFilter.value = "";
  rateFilter.value = "";
  sortFilter.value = "popularity.desc";

  // delete session items
  sessionStorage.removeItem('search_query');
  sessionStorage.removeItem('filter_genre');
  sessionStorage.removeItem('filter_year');
  sessionStorage.removeItem('filter_rate');
  sessionStorage.removeItem('filter_sort');

  fetchMovies(`${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`);
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
  // Btns action
  searchBtn.addEventListener('click', Search);
  searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') Search(); });
  resetBtn.addEventListener('click', resetFilters);

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
    let items = localStorage.getItem("fav");
    if(items!=null)
    {
      items = JSON.parse(items);

    }
    else{
      items = [];
    }
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
        ${overview ? 
          `<h3 style="margin-top: 20px;">Overview</h3>
          <p style="line-height: 1.6;">${overview}</p>` : ''}
        ${trailer ? `<a href="https://www.youtube.com/watch?v=${trailer}" target="_blank" class="view-btn" style="margin-top:20px; display:inline-block;">Watch Trailer</a>` : ''}
        <button id ="add${data.id}" style="border :none ; margin-top:10px ;display:${items.includes(data.id)?"none":"block"}" onclick="addtofav(${data.id})" class="view-btn">Add to favourites</button>
        <button id ="remove${data.id}" style="border :none ; margin-top:10px  ;display:${items.includes(data.id)?"block":"none"}" onclick="removeformfav(${data.id})" class="view-btn">remove from favourites</button>
      </div>
    `;
  } catch (error) {
    container.innerHTML = "<h2>Error loading details.</h2>";
    console.error(error);
  }
}
async function initFav() {
    let items = localStorage.getItem("fav");
    items = JSON.parse(items);
    const container = document.getElementById('main-container');
    if(items== null || items.length ==0)
    {
      container.innerHTML = "<h2>You don't have Movies in favourites yet .</h2>";
      return;
    }  
    try {
      
      let json_data=[];
      for(movie in items)
      {
        // console.log(items[movie])
        const res = await fetch(`${BASE_URL}/movie/${items[movie]}?api_key=${API_KEY}&append_to_response=credits,videos`);
        const status = await res.status;
        if(status != 200 )
        {
            continue;
        }
        const data = await res.json();
        let temp = {
          title :data.title,
          poster_path : data.poster_path,
          vote_average : data.vote_average,
          overview: data.overview, 
          id : data.id
        }
        json_data.push(temp);
      }
      container.innerHTML="";
      showMovies(json_data);


  } catch (error) {
    container.innerHTML = "<h2>Error loading details.</h2>";
    console.error(error);
  }
  
}
function addtofav(id)
{
  let count = localStorage.getItem("count");
  count = JSON.parse(count);
  count++;
  let favcount = document.getElementById("favCount");
  favcount.textContent = count;
  localStorage.setItem("count",count);
  const add = document.getElementById(`add${id}`);
  add.style.display="none";
  const remove = document.getElementById(`remove${id}`);
  remove.style.display="block";
  let items = localStorage.getItem("fav");
  if(items ==null )
  {
    items = [];
    items.push(id);
    localStorage.setItem("fav", JSON.stringify(items));
    return;
  }
  else
  {
    items = JSON.parse(items);
    if(!items.includes(id))
    {
      items.push(id);
      localStorage.setItem("fav", JSON.stringify(items));
    }
  }
}
function removeformfav(id)
{
  let count = localStorage.getItem("count");
  count = JSON.parse(count);
  count--;
  if(count <0) count=0;
  let favcount = document.getElementById("favCount");
  favcount.textContent = count;
  localStorage.setItem("count",JSON.stringify(count));


  let status = confirm("Are you sure to remove this film from favourites ? ");
  if(status)
  {
    const add = document.getElementById(`add${id}`);
    add.style.display="block";
    const remove = document.getElementById(`remove${id}`);
    remove.style.display="none";
    let items = localStorage.getItem("fav");
    items = JSON.parse(items);
    items = items.filter(item=>item != id);
    localStorage.setItem("fav", JSON.stringify(items));
    if(window.location.pathname.includes('fav.html'))
    {
      const deleted_container = document.getElementById(id);
      deleted_container.style.display = "none";
      if(items.length==0)
      {
        const container = document.getElementById('main-container');
        container.innerHTML = "<h2>You don't have Movies in favourites yet .</h2>";
      }
    }
  }
  
  
}