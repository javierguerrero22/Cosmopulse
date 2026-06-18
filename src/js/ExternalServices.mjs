const apiKey = import.meta.env.VITE_NASA_API_KEY;
const nasaURL = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

export default class ExternalServices {
    constructor() {}

    async getApodData() {
        const response = await fetch(nasaURL);
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error("Information could not be obtained from NASA.");
        }
    }

    async getSpaceNews(offset = 0) {
        const newsURL = `https://api.spaceflightnewsapi.net/v4/articles/?limit=6&offset=${offset}`;
        const response = await fetch(newsURL);
        if (response.ok) {
            const data = await response.json();
            return data.results; 
        } else {
            throw new Error("Space news could not be loaded.");
        }
    }

    async getUpcomingLaunches(offset = 0) {
        try {
            const launchesURL = `https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&offset=${offset}`;
            const response = await fetch(launchesURL);
            if (response.ok) {
                const data = await response.json();
                return data.results; 
            } else {
                throw new Error("API Server error (502/404)");
            }
        } catch (error) {
            console.warn("The Space Devs API status: Down. Using local telemetry backup.", error);
            return [
                {
                    id: "mock-launch-1",
                    name: "Falcon 9 Block 5 | Starlink Group 8-1",
                    net: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), 
                    provider: { name: "SpaceX" }
                },
                {
                    id: "mock-launch-2",
                    name: "Ariane 6 | Flight VA269 (Maiden Flight)",
                    net: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), 
                    provider: { name: "Arianespace" }
                },
                {
                    id: "mock-launch-3",
                    name: "Atlas V 551 | Project Kuiper",
                    net: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), 
                    provider: { name: "United Launch Alliance" }
                }
            ];
        }
    }

    async getAsteroidTelemetry() {
        const today = new Date().toISOString().split('T')[0];
        const asteroidsURL = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`;

        const response = await fetch(asteroidsURL);
        if (response.ok) {
            const data = await response.json();
            return data.near_earth_objects[today] || [];
        } else {
            throw new Error("Unable to establish telemetry link with NASA Asteroid Radar.");
        }
    }
}