const version = '1';
const CACHE_NAME = `asif-cache-v${version}`;

let jsonFileCache;

// extendable events - whatever code we put into sw, the browser wants to finish ASAP, when something needs to be delayed, you use ev.waitUntil(promise)
self.addEventListener('install', (ev) => {
    //cache static files, if needed
    console.log("Installed");
});

self.addEventListener('activate', (ev) => {
    //clear old caches, if desired
    console.log("Activated");
});

self.addEventListener('fetch', (ev) => {
    //handle all fetch requests
    // console.log("intercepted a http request", ev.request);
    
});

// receive the user data from the main file
self.addEventListener('message', (ev) => {
    //listen for messages from the main thread
    console.log("\nSW listening for messages from main\n");
    
    console.log("\nReceived data from main thread\n", ev.data);
    
    ev.waitUntil(cacheData(ev.data.saveUsers));
});

function sendMessageToMain() {
    //send a message to the main threads of all clients
    console.log(ev);
}

async function cacheData(users) {
    console.log("\nCaching Data\n");
    console.log(users); // PROBLEM: NO DATA IS BEING SAVED
    
    if (users.length === 0) {
        console.log("No users received");
        return;
    }
    
    // create the json file for users
    const usersFile = new File([JSON.stringify(users)], "users", { type: "application/json"} );
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
        jsonFileCache = await caches.open(CACHE_NAME);

        await jsonFileCache.put("users", usersResponse);
        
        console.log(`Successfully cached data into ${CACHE_NAME}`);
        
    } catch (err) {
        console.warn(`Failed to cache data into ${CACHE_NAME}:`, err);
    }
}
