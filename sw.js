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

// extendable events - whatever code we put into sw, the browser wants to finish ASAP, when something needs to be delayed, you use ev.waitUntil(promise)
self.addEventListener('install', (ev) => {
    //cache static files, if needed
    console.log("Installed");
    ev.waitUntil(
        caches.open(CACHE_NAME_STATIC)
        .then(cache => {
            cache.addAll(assets);
        })
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
            caches.open(CACHE_NAME_JSON)
            .then(cache => {
                return cache.match("users.json");
            })
            .then(cacheResponse => {
                console.log("Cached Response", cacheResponse);

                return cacheResponse || 
                fetch(ev.request)
                .then(fetchResponse => {
                    console.log(fetchResponse);
                    caches.put("users.json", fetchResponse.clone());
                    return fetchResponse;
                }); 
            })
        );
    }
});

self.addEventListener('message', (ev) => {
    //listen for messages from the main thread
    console.log("\nSW listening for messages from main\n");
    
    switch (ev.data.type) {

        // receive the user data from the main file
        case "Cache-Data":
            console.log("\nReceived data from main thread\n", ev.data.msg);
            ev.waitUntil(cacheData(ev.data.msg));
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

async function cacheData(users) {
    console.log("\nCaching Data\n");
    console.log(users);

    if (users.length === 0) {
        console.log("No users received");
        return;
    }

    // create the json file for users
    const usersFile = new File([JSON.stringify(users)], "users.json", { type: "application/json"} );
    console.log("Users File Created", usersFile);

    // create a response object of json file
    const usersResponse = new Response(usersFile, {
        status: 200,
        statusText: "Ok",
        url: usersFile.url,
        headers: {
            "Content-Type": usersFile.type,
            "Content-Length": usersFile.size
        }
    });
    console.log("Users Response Object Created", usersResponse);

    try {
        jsonFileCache = await caches.open(CACHE_NAME_JSON);

        await jsonFileCache.put("users.json", usersResponse);

        console.log(`Successfully cached data into ${CACHE_NAME_JSON}`);

    } catch (err) {
        console.warn(`Failed to cache data into ${CACHE_NAME_JSON}:`, err);
    }
}
