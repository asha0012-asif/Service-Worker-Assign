const version = '1';
const CACHE_NAME_JSON = `json-cache-v${version}`;
const CACHE_NAME_STATIC = `static-cache-v${version}`;

const BASE_URL = "https://random-data-api.com/api/v2/users?size=20";

const assets = [
    "./", 
    "./index.html", 
    "./css/css-reset.css",
    "./js/main.js",
    "./sw.js"
]

let staticFileCache = null;
let jsonFileCache = null;

// extendable events - whatever code we put into sw, the browser wants to finish ASAP, when something needs to be delayed, you use ev.waitUntil(promise)
self.addEventListener('install', (ev) => {
    //cache static files, if needed
    console.log("Installed");

    ev.waitUntil(
        (async () => {
            staticFileCache = await caches.open(CACHE_NAME_STATIC);
            await staticFileCache.addAll(assets);
        })()
    );
});

self.addEventListener('activate', (ev) => {
    console.log("Activated");
    clients.claim().then(()=> console.log('SW is claimed'));
});

self.addEventListener('fetch', (ev) => {
    console.log("\nFetch from SW\n");

    //handle all fetch requests
    const reqURL = new URL(ev.request.url);
    console.log("Intercepted a HTTP request", reqURL);

    const hostName = reqURL.hostname;
    console.log("Host Name", hostName);

    // trying to replace fetch event listener with cache response
    if (BASE_URL.includes(hostName)) {
        ev.respondWith(
            (async () => {
                jsonFileCache = await caches.open(CACHE_NAME_JSON);
                const cacheResponse = await jsonFileCache.match("users.json");

                if (cacheResponse) {
                    return cacheResponse;
                }

                const fetchResponse = await fetch(ev.request);
                await jsonFileCache.put("users.json", fetchResponse.clone());
                return fetchResponse;
            })()
        );
    }
});

self.addEventListener('message', (ev) => {
    //listen for messages from the main thread
    console.log("\nSW listening for messages from main\n");
    
    switch (ev.data.type) {

        // handle one card click
        case "Handle-Card":
            console.log("\nReceived card from main thread\n", ev.data.msg);

            break;

        // handle show all cards click 
        case "Handle-Show-All-Cards":
            console.log("\nReceived all cards from main thread\n", ev.data.msg);

            break;
    
        default:
            console.log("No messages received");
            break;
    }

});

function sendMessageToMain(ev) {
    //send a message to the main threads of all clients
    console.log("\nSW sending messages to main\n");
}
