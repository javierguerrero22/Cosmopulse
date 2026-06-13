import { loadHeaderFooter } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

loadHeaderFooter();

const services = new ExternalServices();

async function loadNasaApod() {
  const apodContainer = document.getElementById("apod-content");
  if (!apodContainer) return;

  try {
    const apodData = await services.getApodData();

    if (apodData.media_type === "image") {
      apodContainer.innerHTML = `
                <h3>${apodData.title}</h3>
                <img src="${apodData.url}" alt="${apodData.title}">
                <p>${apodData.explanation}</p>
            `;
    } else {
      apodContainer.innerHTML = `
                <h3>${apodData.title}</h3>
                <iframe src="${apodData.url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>
                <p>${apodData.explanation}</p>
            `;
    }
  } catch (error) {
    console.error("Error loading NASA APOD:", error);
    apodContainer.innerHTML = `
            <p style="color: #ff6b6b; text-align: center; padding: 20px;">
                We were unable to connect to NASA servers. Please try again later.
            </p>
        `;
  }
}

async function loadSpaceNews() {
  const newsContainer = document.getElementById("news-container");
  if (!newsContainer) return;
  try {
    const articles = await services.getSpaceNews();
    newsContainer.innerHTML = "";

    articles.forEach((article) => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
                <div>
                    <img src="${article.image_url}" alt="${article.title}">
                    <p class="source-text">Source: ${article.news_site}</p>
                    <h4>${article.title}</h4>
                    <p>${article.summary ? article.summary.substring(0, 120) + "..." : "No summary available."}</p>
                </div>
                <a href="${article.url}" target="_blank" class="btn-primary">Read the full article →</a>
            `;
      newsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading Space News:", error);
    newsContainer.innerHTML = `
            <p style="color: #ff6b6b; text-align: center; grid-column: 1 / -1; padding: 20px;">
                 There was a problem synchronizing the news broadcasts.
            </p>
        `;
  }
}

function initDashboard() {
  loadNasaApod();
  loadSpaceNews();
}

document.addEventListener("DOMContentLoaded", initDashboard);
