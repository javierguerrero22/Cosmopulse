import { loadHeaderFooter, handleStarToggle } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

const services = new ExternalServices();
let radarPage = 1;
let currentDistanceUnit = "km";

document.addEventListener("DOMContentLoaded", () => {
    loadHeaderFooter();
    setupRadarControls();
    loadAsteroids();
});

function setupRadarControls() {
    const select = document.getElementById("unit-select");
    if (!select) return;
    select.addEventListener("change", (e) => {
        currentDistanceUnit = e.target.value;
        loadAsteroids(); 
    });
}

async function loadAsteroids() {
    const panel = document.getElementById("asteroid-radar-panel");
    const paginationWrapper = document.getElementById("radar-pagination-wrapper");
    const alertBanner = document.getElementById("global-alert-banner");
    
    if (!panel) return;
    panel.innerHTML = `<div class="loading-state">Scanning deep space...<div id='loader'></div></div>`;
    if (paginationWrapper) paginationWrapper.innerHTML = "";

    try {
        const allAsteroids = await services.getAsteroidTelemetry();
        
        allAsteroids.push({
            id: "MOCK-CRITICAL-999",
            name: "99999 Apophis (SIMULATED THREAT)",
            is_potentially_hazardous_asteroid: true,
            estimated_diameter: { meters: { estimated_diameter_min: 340, estimated_diameter_max: 340 } },
            close_approach_data: [{
                relative_velocity: { kilometers_per_hour: "45000" },
                miss_distance: { kilometers: "31000", miles: "19260", lunar: "0.08" }
            }],
            nasa_jpl_url: "https://neo.jpl.nasa.gov"
        });

        if (!allAsteroids || allAsteroids.length === 0) {
            panel.innerHTML = `<p class="empty-message">Radar clear. No objects tracked nearby for today.</p>`;
            if (alertBanner) alertBanner.classList.add("hidden");
            return;
        }

        const hasHazardousToday = allAsteroids.some(ast => ast.is_potentially_hazardous_asteroid);
        if (alertBanner) {
            if (hasHazardousToday) {
                alertBanner.innerHTML = `⚠️ <strong>CRITICAL ALERT:</strong> NASA radar tracks potentially hazardous objects passing close to Earth today!`;
                alertBanner.classList.remove("hidden");
                alertBanner.style.display = "block";
            } else {
                alertBanner.classList.add("hidden");
                alertBanner.style.display = "none";
            }
        }

        const itemsPerPage = 6;
        const totalPages = Math.ceil(allAsteroids.length / itemsPerPage);
        const startIndex = (radarPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentBatch = allAsteroids.slice(startIndex, endIndex);

        const grid = document.createElement("div");
        grid.className = "radar-grid";

        currentBatch.forEach((asteroid) => {
            const name = asteroid.name;
            const isHazardous = asteroid.is_potentially_hazardous_asteroid;
            const closeApproach = asteroid.close_approach_data[0];
            
            const avgDiameterMeters = (asteroid.estimated_diameter.meters.estimated_diameter_min + asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
            const speedKmH = parseFloat(closeApproach.relative_velocity.kilometers_per_hour);

            let displayDiameter = "", displaySpeed = "", displayDistance = "";

            if (currentDistanceUnit === "km") {
                displayDiameter = `${avgDiameterMeters.toFixed(1)} m`;
                displaySpeed = `${speedKmH.toLocaleString(undefined, {maximumFractionDigits: 2})} km/h`;
                displayDistance = `${parseFloat(closeApproach.miss_distance.kilometers).toLocaleString(undefined, {maximumFractionDigits: 2})} km`;
            } else if (currentDistanceUnit === "mi") {
                displayDiameter = `${(avgDiameterMeters * 3.28084).toLocaleString(undefined, {maximumFractionDigits: 1})} ft`;
                displaySpeed = `${speedKmH * 0.621371.toLocaleString(undefined, {maximumFractionDigits: 2})} mph`;
                displayDistance = `${parseFloat(closeApproach.miss_distance.miles).toLocaleString(undefined, {maximumFractionDigits: 2})} miles`;
            } else if (currentDistanceUnit === "ld") {
                displayDiameter = `${avgDiameterMeters.toFixed(1)} m`;
                displaySpeed = `${speedKmH.toLocaleString(undefined, {maximumFractionDigits: 2})} km/h`;
                displayDistance = `${parseFloat(closeApproach.miss_distance.lunar).toFixed(2)} LD`;
            }

            const savedItems = JSON.parse(localStorage.getItem("cosmopulse_favorites")) || [];
            const isAlreadySaved = savedItems.some(fav => fav.id === asteroid.id);

            const card = document.createElement("div");
            card.className = `media-card ${isHazardous ? 'hazardous-alert' : ''}`;
            
            card.innerHTML = `
                <div class="media-info" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                    <div>
                        <a href="${asteroid.nasa_jpl_url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: inline-block;">
                            <h4 style="color: ${isHazardous ? '#ff3333' : '#00e5ff'}; margin-top: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                                ☄️ Object: ${name}
                            </h4>
                        </a>
                        <p style="font-size: 14px; line-height: 1.6; color: #e0e0e0; margin-bottom: 5px;">
                            <strong>📐 Est. Diameter:</strong> ${displayDiameter}<br>
                            <strong>⚡ Velocity:</strong> ${displaySpeed}<br>
                            <strong>🌍 Miss Distance:</strong> ${displayDistance}<br>
                        </p>
                    </div>
                    <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span style="font-size: 13px; font-weight: bold; color: ${isHazardous ? '#ff3333' : '#00ff66'}">
                            ${isHazardous ? "⚠️ HAZARDOUS" : "✅ SAFE ORBIT"}
                        </span>
                        <button class="star-btn ${isAlreadySaved ? 'active' : ''}" style="margin-top: 0;">
                            ${isAlreadySaved ? '★' : '☆'}
                        </button>
                    </div>
                </div>
            `;

            card.querySelector(".star-btn").addEventListener("click", (e) => {
                handleStarToggle(e.target, {
                    id: asteroid.id,
                    title: `Telemetry: ${name}`,
                    type: 'article',
                    url: '',
                    siteUrl: asteroid.nasa_jpl_url,
                    summary: `Tracked close approach today. Diameter: ${displayDiameter}. Speed: ${displaySpeed}.`
                });
            });

            grid.appendChild(card);
        });

        panel.innerHTML = "";
        panel.appendChild(grid);

        if (paginationWrapper && totalPages > 1) {
            paginationWrapper.innerHTML = `
                <button class="btn-pagination" id="radar-prev" ${radarPage === 1 ? "disabled" : ""}>Previous</button>
                <span style="color: #fff; font-weight: bold; margin: 0 15px;">Scan ${radarPage}/${totalPages}</span>
                <button class="btn-pagination" id="radar-next" ${radarPage === totalPages ? "disabled" : ""}>Next</button>
            `;
            
            paginationWrapper.querySelector("#radar-prev").addEventListener("click", () => changePage(-1));
            paginationWrapper.querySelector("#radar-next").addEventListener("click", () => changePage(1));
        }
    } catch (error) {
        console.error(error);
        panel.innerHTML = `<p class="empty-message">Radar Jammed: Unable to sync data stream.</p>`;
    }
}

async function changePage(direction) {
    radarPage += direction;
    await loadAsteroids();
    document.getElementById("asteroid-radar-panel").scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}