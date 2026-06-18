import { loadHeaderFooter, handleStarToggle, getFavorites, removeFavorite } from "./utils.mjs";

let currentQuery = "";
let galleryPage = 1;

document.addEventListener("DOMContentLoaded", () => {
    loadHeaderFooter();
    setupSearchForm();
    renderUnifiedFavorites();
});

function setupSearchForm() {
    const form = document.getElementById("gallery-search-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const searchInput = document.getElementById("search-input");
        const query = searchInput.value.trim();

        if (query.length < 2) {
            alert("Please enter at least 2 characters.");
            return;
        }

        currentQuery = query;
        galleryPage = 1;
        await fetchNasaImages();
    });
}

async function fetchNasaImages() {
    const resultsContainer = document.getElementById("gallery-search-results");
    const paginationWrapper = document.getElementById("pagination-wrapper");
    
    if (!resultsContainer) return;
    resultsContainer.innerHTML = `<div class="loading-state">Searching NASA...<div id='loader'></div></div>`;
    if (paginationWrapper) paginationWrapper.innerHTML = "";

    try {
        const response = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(currentQuery)}&media_type=image&page=${galleryPage}`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        const items = data.collection.items;

        if (!items || items.length === 0) {
            resultsContainer.innerHTML = `<p class="empty-message">No records found.</p>`;
            return;
        }

        const currentBatch = items.slice(0, 24); 
        renderSearchResults(currentBatch);
        
        if (paginationWrapper) {
            paginationWrapper.innerHTML = `
                <button class="btn-pagination" id="gal-prev" ${galleryPage === 1 ? "disabled" : ""}>Previous</button>
                <span style="color: #fff; font-weight: bold; margin: 0 15px;">Page ${galleryPage}</span>
                <button class="btn-pagination" id="gal-next">Next</button>
            `;

            paginationWrapper.querySelector("#gal-prev").addEventListener("click", () => navigateGallery(-1));
            paginationWrapper.querySelector("#gal-next").addEventListener("click", () => navigateGallery(1));
        }

    } catch (error) {
        console.error(error);
        resultsContainer.innerHTML = `<p class="empty-message">Telemetry error: Unable to connect to NASA archives.</p>`;
    }
}

function renderSearchResults(items) {
    const resultsContainer = document.getElementById("gallery-search-results");
    const savedItems = getFavorites();
    resultsContainer.innerHTML = "";
    
    items.forEach(item => {
        const nasaId = item.data[0].nasa_id;
        const title = item.data[0].title;
        const imgUrl = item.links[0].href;

        const isAlreadySaved = savedItems.some(fav => fav.id === nasaId);
        
        const card = document.createElement("div");
        card.className = "media-card";
        card.innerHTML = `
            <img src="${imgUrl}" alt="${title}" loading="lazy">
            <div class="media-info">
                <h4>${title}</h4>
                <button class="star-btn ${isAlreadySaved ? 'active' : ''}">${isAlreadySaved ? '★' : '☆'}</button>
            </div>
        `;

        card.querySelector(".star-btn").addEventListener("click", (e) => {
            handleStarToggle(e.target, { id: nasaId, title, type: "image", url: imgUrl });
            renderUnifiedFavorites(); 
        });

        resultsContainer.appendChild(card);
    });
}

async function navigateGallery(direction) {
    galleryPage += direction;
    await fetchNasaImages();
    document.getElementById("gallery-search-form").scrollIntoView({ behavior: 'smooth' });
}

function renderUnifiedFavorites() {
    const container = document.getElementById("unified-favorites-gallery");
    if (!container) return;

    const savedItems = getFavorites();

    if (savedItems.length === 0) {
        container.innerHTML = `<p class="empty-message">Your custom universe is empty.</p>`;
        return;
    }

    container.innerHTML = "";
    const newestFirst = [...savedItems].reverse();

    newestFirst.forEach(item => {
        const card = document.createElement("div");
        
        if (item.type === "image") {
            card.className = "media-card";
            card.innerHTML = `
                <img src="${item.url}" alt="${item.title}" loading="lazy">
                <div class="media-info">
                    <h4>${item.title}</h4>
                    <button class="fav-btn btn-danger remove-btn">❌ Remove Discovery</button>
                </div>
            `;
        } else if (item.type === "article") {
            card.className = "news-card";
            card.innerHTML = `
                <div>
                    <h4>📰 ${item.title}</h4>
                    <p class="news-desc">${item.summary || "Archived scientific log."}</p>
                </div>
                <div class="card-actions">
                    ${item.siteUrl ? `<a href="${item.siteUrl}" target="_blank" class="fav-btn btn-primary">Read Article</a>` : ''}
                    <button class="fav-btn btn-danger remove-btn">❌ Remove Log</button>
                </div>
            `;
        }

        card.querySelector(".remove-btn").addEventListener("click", () => {
            removeFavorite(item.id);
            renderUnifiedFavorites(); 

            if (currentQuery) {
                fetchNasaImages(); 
            }
        });

        container.appendChild(card);
    });
}