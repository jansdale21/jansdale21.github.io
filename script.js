const searchClient = algoliasearch('CSWSDEW39Q', 'c2a11ea57eebc711be5b9fda17c6f4d8');

const search = instantsearch({
  indexName: 'movies',
  searchClient,
  routing: true,
});

const escapeHtml = (value) => {
  const stringValue = String(value || '');
  return stringValue.replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#39;'
  })[char]);
};

const getYear = (hit) => {
  if (hit.release_year) return hit.release_year;
  if (hit.release_date) return String(hit.release_date).slice(0, 4);
  return 'Unknown';
};

const hitTemplate = (hit) => {
  const title = hit.title || hit.name || 'No title';
  const rating = hit.vote_average || hit.rating || 'N/A';
  const poster = hit.poster_url || hit.poster || hit.image || '';
  const year = getYear(hit);
  const genres = Array.isArray(hit.genres) ? hit.genres.join(', ') : hit.genres || 'Unknown';
  const overview = hit.overview || hit.description || hit.plot || 'No description available.';

  return `
    <article class="hit-card cursor-pointer group overflow-hidden rounded-[28px] border border-slate-800/70 bg-slate-900/90 shadow-2xl shadow-slate-950/20 transition-transform duration-200 hover:-translate-y-1" data-hit='${escapeHtml(JSON.stringify(hit))}'>
      ${poster ? `<div class="hit-image w-full aspect-[2/3]" style="background-image:url('${escapeHtml(poster)}')"></div>` : '<div class="hit-image placeholder w-full aspect-[2/3]">No poster available</div>'}
      <div class="p-5">
        <h2 class="text-lg font-semibold text-white">${escapeHtml(title)}</h2>
        <p class="mt-2 text-sm text-slate-400">${escapeHtml(year)} · Rating ${escapeHtml(rating)}</p>
        <p class="mt-3 text-sm text-slate-300">Genre: ${escapeHtml(genres)}</p>
        <p class="mt-4 text-sm leading-6 text-slate-300 overview">${escapeHtml(overview)}</p>
      </div>
    </article>
  `;
};

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
    placeholder: 'Search for movies...',
    showReset: false,
    showSubmit: true,
    searchAsYouType: true,
  }),

  instantsearch.widgets.clearRefinements({
    container: '#clear-refinements',
    templates: {
      resetLabel: 'Reset filters',
    },
  }),

  instantsearch.widgets.stats({
    container: '#stats',
  }),

  instantsearch.widgets.refinementList({
    container: '#genre-list',
    attribute: 'genres',
    operator: 'and',
    searchable: false,
    showMore: true,
    limit: 8,
    showMoreLimit: 30,
    sortBy: ['isRefined', 'count:desc', 'name:asc'],
  }),

  instantsearch.widgets.menuSelect({
    container: '#year-list',
    attribute: 'release_year',
    limit: 20,
    sortBy: ['count:desc', 'name:desc'],
    templates: {
      defaultOption: 'All years',
    },
  }),

  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: hitTemplate,
      empty: '<div class="empty-state">No movies found. Try another keyword or clear the filters.</div>',
    },
  }),

  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
]);

const showMovieDetail = (event, hitData) => {
  event.stopPropagation();
  let hit;
  try {
    hit = typeof hitData === 'string' ? JSON.parse(hitData) : hitData;
  } catch (error) {
    return;
  }

  const title = hit.title || hit.name || 'No title';
  const year = getYear(hit);
  const rating = hit.vote_average || hit.rating || 'N/A';
  const poster = hit.poster_url || hit.poster || hit.image || '';
  const genres = Array.isArray(hit.genres) ? hit.genres.join(', ') : hit.genres || 'Unknown';
  const overview = hit.overview || hit.description || hit.plot || 'No description available.';

  document.getElementById('detail-title').textContent = title;
  document.getElementById('detail-meta').textContent = `${year} · Rating ${rating}`;
  document.getElementById('detail-genres').textContent = `Genre: ${genres}`;
  document.getElementById('detail-overview').textContent = overview;
  document.getElementById('detail-poster').style.backgroundImage = poster ? `url('${poster}')` : 'none';
  document.getElementById('detail-poster').textContent = poster ? '' : 'No poster available';
  const modal = document.getElementById('movie-detail-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

const closeMovieDetail = () => {
  const modal = document.getElementById('movie-detail-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
};

document.getElementById('movie-detail-close').addEventListener('click', closeMovieDetail);
document.getElementById('movie-detail-modal').addEventListener('click', (event) => {
  if (event.target.id === 'movie-detail-modal') {
    closeMovieDetail();
  }
});

document.getElementById('hits').addEventListener('click', (event) => {
  const hitCard = event.target.closest('.hit-card');
  if (hitCard && hitCard.dataset.hit) {
    showMovieDetail(event, hitCard.dataset.hit);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const target = event.target;
  if (target instanceof HTMLElement && target.matches('.ais-SearchBox-input') && target.closest('#genre-list')) {
    event.preventDefault();
    event.stopPropagation();
  }
});

const updateGenreShowMoreVisibility = () => {
  const genreList = document.getElementById('genre-list');
  if (!genreList) return;
  const showMoreButton = genreList.querySelector('.ais-RefinementList-showMore');
  if (!showMoreButton) return;
  const hasSelectedGenre = genreList.querySelector('.ais-RefinementList-item--selected') !== null;
  showMoreButton.style.display = hasSelectedGenre ? 'none' : '';
};

const genreListContainer = document.getElementById('genre-list');
if (genreListContainer) {
  const observer = new MutationObserver(updateGenreShowMoreVisibility);
  observer.observe(genreListContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  updateGenreShowMoreVisibility();
}

search.start();