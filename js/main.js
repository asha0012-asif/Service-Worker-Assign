const APP = {
    BASE_URL: null,
    cards: null,

    init: () => {
        APP.BASE_URL = "https://random-data-api.com/api/v2/users?size=20";

        APP.cards = document.getElementById("cards");

        // register the service worker and add 
        // message event listener

        // listen for navigation popstate event

        // get the data for the page
        APP.getData();

        // add click listener to #cards 
        APP.cards.addEventListener("click", APP.handleCardClicks);
    },

    registerSW: () => {},

    checkState: () => {},

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
    },

    sendMessageToSW: () => {},

    receiveMessageFromSW: () => {}
}

window.addEventListener("DOMContentLoaded", APP.init);