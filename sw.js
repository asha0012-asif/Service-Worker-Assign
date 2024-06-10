const version = '1';
const CACHE_NAME_JSON = `asif-cache-v${version}--json`;
const CACHE_NAME_STATIC = `asif-cache-v${version}--static`;

const BASE_URL = "https://random-data-api.com/api/v2/users?size=20";

const assets = [
    "/", 
    "/index.html", 
    "/css/css-reset.css",
    "/js/main.js"
]

let staticFileCache;
let jsonFileCache;

// extendable events - whatever code we put into sw, the browser wants to finish ASAP, when something needs to be delayed, you use ev.waitUntil(promise)
self.addEventListener('install', (ev) => {
    //cache static files, if needed
    console.log("Installed");
    ev.waitUntil(async () => {
        staticFileCache = await caches.open(CACHE_NAME_STATIC);
        staticFileCache.addAll(assets);
    });
});

self.addEventListener('activate', (ev) => {
    //clear old caches, if desired
    console.log("Activated");
});

self.addEventListener('fetch', (ev) => {
    //handle all fetch requests
    console.log("Intercepted a HTTP request", ev.request);

    // ev.respondWith(async () => {
    //     try {
    //         jsonFileCache = await caches.open(CACHE_NAME_JSON);
    //         const cachedResponse = await jsonFileCache.match("users.json");
    //         console.log("Cached response:", cachedResponse);

    //         if (cachedResponse) {
    //             return cachedResponse;    
    //         } else {
    //             try {     
    //                 const fetchResponse = await fetch(ev.request);
    //                 fetchResponse && jsonFileCache.put("users.json", fetchResponse.clone());

    //                 return fetchResponse;
    //             } catch (err) {
    //                 console.warn("Failed to fetch from API", err);
    //             }
    //         }

    //     } catch (error) {
    //         console.warn("Failed to open JSON cache");
    //     }        
    // });
});

// receive the user data from the main file
self.addEventListener('message', (ev) => {
    //listen for messages from the main thread
    console.log("\nSW listening for messages from main\n");
    
    switch (ev.data.type) {
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
