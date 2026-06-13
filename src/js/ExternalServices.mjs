const apiKey = import.meta.env.VITE_NASA_API_KEY;
const nasaURL = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
const newsURL = "https://api.spaceflightnewsapi.net/v4/articles/?limit=6";

export default class ExternalServices {
    constructor() {}

    async getApodData() {
        // console.log("BASE URL is:", apiKey);
        const response = await fetch(nasaURL);

        if (response.ok) {
            return await response.json();

        } else {
            throw new Error("Information could not be obtained from NASA.");
        }
    }

    async getSpaceNews() {
        const response = await fetch(newsURL);
        if (response.ok) {
            const data = await response.json();
            return data.results; 
        } else {
            throw new Error("Space news could not be loaded.");
        }
    }
}