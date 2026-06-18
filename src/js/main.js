import { loadHeaderFooter, handleStarToggle } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

const services = new ExternalServices();

document.addEventListener("DOMContentLoaded", () => {
  loadHeaderFooter();
  loadNasaApod();
  loadSpaceNews();
});

async function loadNasaApod() {
  const apodContainer = document.getElementById("apod-content");
  if (!apodContainer) return;

  try {
    const apodData = await services.getApodData();
    const isImage = apodData.media_type === "image";
    
    const savedItems = JSON.parse(localStorage.getItem("cosmopulse_favorites")) || [];
    const isAlreadySaved = savedItems.some(fav => fav.id === apodData.date);

    apodContainer.innerHTML = `
      <h3>${apodData.title}</h3>
      ${isImage 
        ? `<img src="${apodData.url}" alt="${apodData.title}" loading="lazy">` 
        : `<iframe src="${apodData.url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`
      }
      <p>${apodData.explanation}</p>
      <div style="display: flex; justify-content: flex-end;">
        <button class="star-btn ${isAlreadySaved ? 'active' : ''}">${isAlreadySaved ? '★' : '☆'}</button>
      </div>
    `;

    apodContainer.querySelector(".star-btn").addEventListener("click", (e) => {
      handleStarToggle(e.target, {
        id: apodData.date,
        title: apodData.title,
        type: "image",
        url: apodData.url,
        siteUrl: "",
        summary: apodData.explanation.substring(0, 140) + "..."
      });
    });

  } catch (error) {
    console.error("Error loading NASA APOD:", error);
    apodContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 20px;">We were unable to connect to NASA servers.</p>`;
  }
}

async function loadSpaceNews() {
  const newsContainer = document.getElementById("news-container");
  if (!newsContainer) return;

  try {
    const articles = await services.getSpaceNews();
    newsContainer.innerHTML = "";

    articles.forEach((article) => {
      const savedItems = JSON.parse(localStorage.getItem("cosmopulse_favorites")) || [];
      const isAlreadySaved = savedItems.some(fav => fav.id === article.id.toString());

      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
        <div>
            <img src="${article.image_url || ''}" alt="${article.title || 'Space News'}" loading="lazy">
            <p class="source-text">Source: ${article.news_site}</p>
            <h4>${article.title}</h4>
            <p>${article.summary ? article.summary.substring(0, 120) + "..." : "No summary available."}</p>
        </div>
        <div class="card-actions" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <a href="${article.url}" target="_blank" class="fav-btn btn-primary">Read full article →</a>
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

      newsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading Space News:", error);
    newsContainer.innerHTML = `<p class="empty-message">There was a problem synchronizing the news broadcasts.</p>`;
  }
}