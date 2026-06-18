import { loadHeaderFooter, handleStarToggle } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

const services = new ExternalServices();

let launchesPage = 1;
let newsPage = 1;
let countdownIntervals = [];

document.addEventListener("DOMContentLoaded", async () => {
    loadHeaderFooter();
    await Promise.all([loadLaunches(), loadNews()]);
});

async function loadLaunches() {
    const container = document.getElementById("launches-container");
    const paginationWrapper = document.getElementById("launches-pagination-wrapper");
    const modal = document.getElementById("launch-modal");
    const modalInfo = document.getElementById("modal-flight-info");
    const closeBtn = document.getElementById("close-modal-btn");
    
    if (!container) return;

    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
        };
    }

    const offset = (launchesPage - 1) * 5;
    container.innerHTML = `<div class="loading-state">Syncing orbital telemetry...<div id='loader'></div></div>`;
    if (paginationWrapper) paginationWrapper.innerHTML = "";

    try {
        const launches = await services.getUpcomingLaunches(offset);
        
        countdownIntervals.forEach(clearInterval);
        countdownIntervals = [];
        container.innerHTML = ""; 

        if (!launches || launches.length === 0) {
            container.innerHTML = `<p class="empty-message">No more launch schedules found.</p>`;
            return;
        }

        launches.forEach((launch, index) => {
            const launchDate = launch.net || launch.window_start;
            const timerId = `timer-${index}`;
            const hasValidDate = launchDate && !isNaN(new Date(launchDate).getTime());

            const savedItems = JSON.parse(localStorage.getItem("cosmopulse_favorites")) || [];
            const isAlreadySaved = savedItems.some(fav => fav.id === launch.id.toString());

            const card = document.createElement("div");
            card.className = "launch-card";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <div>
                        <span class="launch-title-trigger" style="cursor: pointer; display: inline-block;">
                            <h3>${launch.name}</h3>
                        </span>
                        <p class="launch-desc">${launch.provider?.name || "Global Mission"}</p>
                    </div>
                    <button class="star-btn ${isAlreadySaved ? 'active' : ''}" style="margin-top: 0;">
                        ${isAlreadySaved ? '★' : '☆'}
                    </button>
                </div>
                ${hasValidDate 
                    ? `<div class="countdown-clock" id="${timerId}">00d : 00h : 00m : 00s</div>`
                    : `<div class="countdown-clock" style="color: #ffb300; font-style: italic; font-size: 14px;">Time window not provided by telemetry</div>`
                }
            `;

            if (hasValidDate) {
                startCountdown(launchDate, timerId);
            }

            card.querySelector(".launch-title-trigger").addEventListener("click", () => {
                if (!modalInfo || !modal) return;
                const localDate = hasValidDate ? new Date(launchDate).toLocaleString() : "To Be Determined (TBD)";
                const missionDesc = launch.mission?.description || "No mission description provided by telemetry.";
                const padName = launch.pad?.name || "TBD (To Be Determined)";
                const locationName = launch.pad?.location?.name || "International Launch Site";

                modalInfo.innerHTML = `
                    <h2 style="color: #00e5ff; margin-bottom: 10px; font-size: 22px;">${launch.name}</h2>
                    <p style="margin-bottom: 15px; font-size: 14px; color: #aaa;">
                        <strong>Provider:</strong> ${launch.provider?.name || "Global Mission"}
                    </p>
                    <hr style="border: 0; border-top: 1px solid #222; margin-bottom: 15px;">
                    <div style="text-align: left; font-size: 15px; line-height: 1.6;">
                        <p><strong>🚀 Target Liftoff:</strong> ${localDate}</p>
                        <p><strong>📍 Launch Pad:</strong> ${padName}</p>
                        <p><strong>🌍 Location:</strong> ${locationName}</p>
                        <br>
                        <p><strong>📋 Mission Details:</strong></p>
                        <p style="color: #ccc; font-size: 14px; background: #131924; padding: 10px; border-radius: 6px; border-left: 3px solid #00e5ff;">
                            ${missionDesc}
                        </p>
                    </div>
                `;
                modal.style.display = "flex";
            });

            card.querySelector(".star-btn").addEventListener("click", (e) => {
                handleStarToggle(e.target, {
                    id: launch.id.toString(),
                    title: launch.name,
                    type: 'article', 
                    url: '',
                    siteUrl: '',
                    summary: `Upcoming launch managed by ${launch.provider?.name || "Global Mission"}.`
                });
            });

            container.appendChild(card);
        });

        if (paginationWrapper) {
            paginationWrapper.innerHTML = `
                <button class="btn-pagination" id="prev-launches" ${launchesPage === 1 ? "disabled" : ""}>Previous</button>
                <span style="color: #fff; font-weight: bold; margin: 0 15px;">Page ${launchesPage}</span>
                <button class="btn-pagination" id="next-launches">Next</button>
            `;

            paginationWrapper.querySelector("#prev-launches").addEventListener("click", () => navigateLaunches(-1));
            paginationWrapper.querySelector("#next-launches").addEventListener("click", () => navigateLaunches(1));
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="empty-message">Error loading launch schedules. Please try again later.</p>`;
    }
}

async function navigateLaunches(direction) {
    launchesPage += direction;
    await loadLaunches();
    document.getElementById("launches-container").scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function startCountdown(targetDateStr, elementId) {
    const targetDate = new Date(targetDateStr).getTime();

    const interval = setInterval(() => {
        const displayElement = document.getElementById(elementId);
        
        if (!displayElement) {
            clearInterval(interval);
            return;
        }

        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) {
            displayElement.innerHTML = "LIFTOFF! 🚀";
            clearInterval(interval);
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        displayElement.innerHTML = `
            ${String(days).padStart(2, '0')}d : 
            ${String(hours).padStart(2, '0')}h : 
            ${String(minutes).padStart(2, '0')}m : 
            ${String(seconds).padStart(2, '0')}s
        `;
    }, 1000);

    countdownIntervals.push(interval);
}

async function loadNews() {
    const container = document.getElementById("news-content");
    const paginationWrapper = document.getElementById("news-pagination-wrapper");
    if (!container) return;

    const offset = (newsPage - 1) * 6;
    container.innerHTML = `<div class="loading-state">Scanning deep space...<div id='loader'></div></div>`;
    if (paginationWrapper) paginationWrapper.innerHTML = "";

    try {
        const newsData = await services.getSpaceNews(offset);
        container.innerHTML = ""; 

        if (!newsData || newsData.length === 0) {
            container.innerHTML = `<p class="empty-message">No more space updates found.</p>`;
            return;
        }

        newsData.forEach((article) => {
            const savedItems = JSON.parse(localStorage.getItem("cosmopulse_favorites")) || [];
            const isAlreadySaved = savedItems.some(fav => fav.id === article.id.toString());

            const card = document.createElement("div");
            card.className = "news-card";
            card.innerHTML = `
                <div>
                    <h4>${article.title}</h4>
                    <p class="news-desc">${article.summary ? article.summary.substring(0, 120) + "..." : "No description available."}</p>
                </div>
                <div class="card-actions" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <a href="${article.url}" target="_blank" class="fav-btn btn-primary">Read Full Article</a>
                    <button class="star-btn ${isAlreadySaved ? 'active' : ''}">${isAlreadySaved ? '★' : '☆'}</button>
                </div>
            `;

            card.querySelector(".star-btn").addEventListener("click", (e) => {
                handleStarToggle(e.target, {
                    id: article.id.toString(),
                    title: article.title,
                    type: 'article',
                    url: '',
                    siteUrl: article.url,
                    summary: article.summary || "No description available."
                });
            });

            container.appendChild(card);
        });

        if (paginationWrapper) {
            paginationWrapper.innerHTML = `
                <button class="btn-pagination" id="prev-news" ${newsPage === 1 ? "disabled" : ""}>Previous</button>
                <span style="color: #fff; font-weight: bold; margin: 0 15px;">Page ${newsPage}</span>
                <button class="btn-pagination" id="next-news">Next</button>
            `;

            paginationWrapper.querySelector("#prev-news").addEventListener("click", () => navigateNews(-1));
            paginationWrapper.querySelector("#next-news").addEventListener("click", () => navigateNews(1));
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="empty-message">Could not load space news feed at this time.</p>`;
    }
}

async function navigateNews(direction) {
    newsPage += direction;
    await loadNews();
    document.getElementById("news-content").scrollIntoView({ behavior: 'smooth' });
}