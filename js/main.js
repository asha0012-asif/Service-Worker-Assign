/* ISSUES:
- historyAPI; displays only the image when clicking forward button (correct behaviour), displays all images when clicking backwards even though a hash value is present in the url 
- historyAPI; displaying all images works when clicking forward button but shows nothing when clicking backwards button
*/

const APP = {
    BASE_URL: null,
    cards: null,

    init: () => {
        APP.BASE_URL = "https://random-data-api.com/api/v2/users?size=20";

        APP.cards = document.getElementById("cards");
        
        APP.checkState();

        // register the service worker and add 
        // message event listener

        // listen for navigation popstate event

        // popstate is triggered based on the history of the page (back & forward button, works with links changing the state of the page)
        window.addEventListener("popstate", APP.checkState);

        // get the data for the page
        APP.getData();

        // add click listener to #cards 
        APP.cards.addEventListener("click", APP.handleCardClicks);
    },

    registerSW: () => {},

    checkState: () => {
        console.log("\nChecking State\n");

        console.log(location.hash);
        console.log(history.state);
        APP.cards.innerHTML = "";

        if (location.hash !== "") {
            console.log("Hash");
            const card = APP.showOneCard(history.state);
            card.setAttribute("data-uid", location.hash.replace("#", ""));

            APP.cards.append(card);
        } else {
            console.log("Default");
        }

    },

    getData: async () => {
        console.log("\nGetting Data\n");

        try {
            const response = await fetch(APP.BASE_URL);
            console.log(response);

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

            // cache newUsers as users.json file

            APP.showCards(newUsers);
        } catch (err) {
            console.warn(err);
        }
    },

    showCards: (users=[]) => {
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
        history.pushState(user, "", `${location.href}${hash}`);
        APP.checkState();
    },

    sendMessageToSW: () => {},

    receiveMessageFromSW: () => {}
}

window.addEventListener("DOMContentLoaded", APP.init);