const APP = {
    BASE_URL: null,
    CACHE_NAME_JSON: null,
    cards: null,

    init: () => {
        APP.BASE_URL = "https://random-data-api.com/api/v2/users?size=20";
        APP.CACHE_NAME_JSON = `asif-cache-v1--json`,

        APP.cards = document.getElementById("cards");
        
        APP.checkState();

        // register the service worker and add 
        // message event listener
        APP.registerSW();

        // listen for navigation popstate event

        // popstate is triggered based on the history of the page (back & forward button, works with links changing the state of the page)
        window.addEventListener("popstate", APP.checkState);

        // get the data for the page
        APP.getData();

        // add click listener to #cards 
        APP.cards.addEventListener("click", APP.handleCardClicks);
    },

    registerSW: () => {
        console.log("Registering Service Worker");

        window.addEventListener("load", async () => {
            if ("serviceWorker" in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register("../sw.js", { scope: "/" });
    
                    registration && console.log("Service worker is registered", registration);
    
                } catch (err) {
                    console.warn("Failed to register service worker", err);
                }

                // listen for messages from the SW
                navigator.serviceWorker.addEventListener("message", APP.receiveMessageFromSW);

            } else {
                console.log("Service workers are not supported");
            }
        });
    },

    checkState: () => {
        console.log("\nChecking State\n");

        console.log(location.hash);
        console.log(history.state);
        APP.cards.innerHTML = "";

        if (location.hash !== "") {
            console.log("Hash");
            const card = APP.showOneCard(history.state);
            card.setAttribute("data-uid", location.hash.replace("#", ""));

            history.replaceState(history.state, "", `${location.origin}${location.pathname}${location.hash}`);

            APP.cards.append(card);
        } else {
            console.log("Default");
            location.hash.replace("#", "");

            APP.showCards();
        }
    },

    getData: async () => {
        console.log("\nGetting Data\n");

        try {
            // with the sw, this value is replaced with a new response from the promise it returns
            const response = await fetch(APP.BASE_URL);
            console.log("RESPONSE", response);

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const users = await response.json();
            console.log(users);

            const newUsers = users.map(({uid, first_name, last_name, email, avatar}) => {
                return {
                    uid, 
                    full_name: first_name + " " + last_name, 
                    email, 
                    avatar
                }
            });

            APP.sendMessageToSW({
                type: "Cache-Data",
                msg: users
            });

            // display the cards
            APP.showCards(newUsers);

        } catch (err) {
            console.warn(err);
        }
    },

    showCards: (users) => {
        console.log("\nShowing Cards\n");

        if (!users) {
            return;
        }

        let df = new DocumentFragment();
        
        users.forEach((user) => {
            const card = APP.showOneCard(user); 
            df.append(card); 
        });

        APP.cards.append(df);
    },

    showOneCard: ({uid, full_name, email, avatar}) => {
        const card = document.createElement("li");
        card.setAttribute("data-uid", uid);
        card.className = "card";

        card.innerHTML = `
        <img src="${avatar}" alt="${full_name}" class="card__avatar">
        <h3 class="card__full-name">${full_name}</h3>
        <p class="card__email">${email}</p>
        `;

        return card;
    },
    
    handleCardClicks: (ev) => {
        ev.preventDefault();
        console.log("\nHandling Card Click\n");

        const card = ev.target.closest(".card");
        console.log(card);

        const user = {
            email: card.querySelector(".card__email").textContent,
            full_name: card.querySelector(".card__full-name").textContent,
            avatar: card.querySelector(".card__avatar").getAttribute("src")
        }
        
        // hashchange is triggered based on when the hash route is changed (ex. from "#" to "#blah")
        const hash = `#${card.getAttribute("data-uid")}`;
        document.title = hash;
        console.log(hash);

        // change the hash value in the URL
        history.pushState(user, "", `${location.origin}${location.pathname}${hash}`);
        APP.checkState();
    },

    sendMessageToSW: (msg) => {
        console.log("\nSending Message to SW\n");
        console.log(msg);

        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(msg);
        }
    },

    receiveMessageFromSW: (ev) => {
        console.log("\nReceiving Message from SW\n");
        console.log(ev.data);
    }
}

window.addEventListener("DOMContentLoaded", APP.init);