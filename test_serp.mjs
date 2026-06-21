import fetch from 'node-fetch';

const API_KEY = "052a48b862c8730aa3e104d7dc155b1d0ed111a83b2fe0c57eb4a207c4b77082";
const url = `https://serpapi.com/search.json?engine=google_events&q=events+in+Los+Angeles&htichips=date:next_month&api_key=${API_KEY}`;

async function run() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Success?", !!data.events_results);
        if (!data.events_results) {
            console.log("Data:", data);
        } else {
            console.log("Results count:", data.events_results.length);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
