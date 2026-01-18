import { indianAirports } from './Airports.js';
import { clientId, clientSecret } from './config.js';

const search_btn = document.querySelector("#search_btn");
const header = document.querySelector("header");
const results = document.querySelector("#results");
const flight_cards = document.querySelector("#flight_cards");
const pick = document.querySelector("#pick_price");
const edit = document.querySelector("#edit");
const new_price_input = document.querySelector("#new_picked_price");
const heading = document.querySelector("h1");
const watchList = document.querySelector("#watchlist_sec");
const watchList_btn = document.querySelector("#watchlist_btn");
const watchList_title = document.querySelector("h2");
const my_flights = document.querySelector("#my_flights");
const back_btn = document.querySelectorAll(".back_btn");
const from_place = document.querySelector("#from_place");
const to_place = document.querySelector("#to_place");
const date = document.querySelector("#from_date");
const airport_options = document.querySelector("#airport_suggestions");
const sort_and_filter_sec = document.querySelector("#sortandfilter");
const sort_type = document.querySelector("#sort_select");
const filter_type = document.querySelector("#filter_select");
const no_results = document.querySelector("#no_results");
const no_results_btn = document.querySelector("#no_results_btn");
const no_watchlisted_flights = document.querySelector("#no_watchlisted_flights");
const no_watchlisted_flights_btn = document.querySelector("#no_watchlisted_flights_btn");
const no_response = document.querySelector("#no_response");
const no_response_btn = document.querySelector("#no_response_btn");
const pick_btn = document.querySelector("#pick_flight");
const pick_close_btn = document.querySelector("#pick_close");
const edit_close_btn = document.querySelector("#edit_close");
const delete_close_btn = document.querySelector("#delete_close");
const edit_btn = document.querySelector("#edit_btn");
const delete_btn = document.querySelector("#delete_btn");
const home_btn = document.querySelectorAll(".home_btn");
const history_btn = document.querySelector("#history_btn");
const history_sec = document.querySelector("#history_sec");
const past_flights_sec = document.querySelector("#past_flights");
const delete_sec = document.querySelector("#delete");
const no_past_flights = document.querySelector("#no_past_flights");
const no_past_flights_btn = document.querySelector("#no_past_flights_btn");
const cancel_btn = document.querySelector("#cancel");
const history_delete_btn = document.querySelector("#delete_my_flights");
const delete_all_box = document.querySelector("#delete_all_box");
const delete_all = document.querySelector("#delete_all");
const delete_all_cancel = document.querySelector("#cancel_all");
const delete_all_btn = document.querySelector("#delete_all_flights");
const backdrop = document.querySelector("#modal_backdrop");
const today = new Date().toISOString().split('T')[0];
let EXR = 1;
let curr_idx = null;
let prev_view = null;
let curr_price = null;
let picked_price = null;
let curr_view = "home";


(async () =>{
    airport_options.innerHTML = "";
    for(let i of indianAirports){
        let html = `<option value="${Object.values(i)[0]}">${Object.keys(i)[0]}</option>`;
        airport_options.innerHTML += html;
    }
})();

let flights = [];

let flights_ToSave = null;

let saved_Flights = JSON.parse(localStorage.getItem("my_flights")) || [];
let past_flights  = JSON.parse(localStorage.getItem("flight_history")) || [];

let active_flights = saved_Flights.filter(flight => flight.date >= today);
let new_expired = saved_Flights.filter(flight => flight.date < today);
if (new_expired.length > 0) {
    past_flights = [...past_flights, ...new_expired];
    saved_Flights = active_flights;
    localStorage.setItem("flight_history", JSON.stringify(past_flights));
    localStorage.setItem("my_flights", JSON.stringify(active_flights));
}

const showServerError = () => {
    result_loader.classList.add("hidden");
    result_loader.classList.remove("result_loader");
    no_response.classList.add("no_results");
    backdrop.classList.remove("hidden");
    no_response.classList.remove("hidden");
}

const getAccessToken = async () => {
    try{
        let response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
                        })
        if(response.ok){
            let data = await response.json();
            return data.access_token;
        }else showServerError();
    }catch(error){
        showServerError();
    }
}

const getExchangeRate = async () => {
    try{
        let res = await fetch(`https://v6.exchangerate-api.com/v6/f8afdba7273ffb8cc3d85343/latest/EUR`);
        if(res.ok){
            let data = await res.json();
            return data.conversion_rates["INR"];
        }else showServerError(); 
    }catch(error){
        showServerError();
    }
}

const toINR = (amount) =>{
    return Math.floor(EXR*amount*100)/100
}

const getFlights = async (token, origin, destination, date) => {
    try{
        let response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=1`, {
                            method: 'GET',
                            headers: {
                                "Authorization": `Bearer ${token}`
                            }
                        })
        if(response.ok){
            let data = await response.json();
            flights = data.data;
            console.log(flights);
        }else{
        let errorBody = await response.text();
        console.error("❌ API Error Details:", errorBody);
        console.error("❌ Status Code:", response.status);
        showServerError();
        return;
    }
    }catch(error){
        showServerError();
    }
}

const showNoResult = () => {
    no_results.classList.remove("hidden");
    no_results.classList.add("no_results");
    backdrop.classList.remove("hidden");
};

const showNoWatchlist = () => {
    no_watchlisted_flights.classList.remove("hidden");
    no_watchlisted_flights.classList.add("no_results");
    backdrop.classList.remove("hidden");
};
const showNoPast = () => {
    no_past_flights.classList.remove("hidden");
    no_past_flights.classList.add("no_results");
    backdrop.classList.remove("hidden");
};
const formatTime = (str) => {
    return str.split('T')[1].slice(0,5);
};

const formatLength = (str) => {
    return str.split('T')[1].slice(0,6).replace("H","h").replace("M","m")
};

const saveFlight = (arr) => {
    let stops = arr.itineraries[0].segments.length - 1;
    return {
        "airline" : arr.validatingAirlineCodes[0],
        "departure_airport" : arr.itineraries[0].segments[0].departure.iataCode,
        "departure_time" : formatTime(arr.itineraries[0].segments[0].departure.at),
        "flight_length" : formatLength(arr.itineraries[0].duration),
        "arrival_airport" : arr.itineraries[0].segments[stops].arrival.iataCode,
        "arrival_time" : formatTime(arr.itineraries[0].segments[stops].arrival.at),
        "price" : toINR(arr.price.grandTotal),
        "lowest_price" : toINR(arr.price.grandTotal),
        "stops" : stops
    };
};

const getMinutes = (timeStr) => {
    let [hours, minutes] = timeStr.split(":").map(Number);
    return (hours * 60) + minutes;
};

const getDurationMinutes = (str) => {
    let duration = str.replace("PT", "");
    let hours = 0, minutes = 0;
    if(duration.includes("H")) {
        hours = parseInt(duration.split("H")[0]);
        duration = duration.split("H")[1] || "";
    }
    if(duration.includes("M")) {
        minutes = parseInt(duration.split("M")[0]);
    }
    return (hours * 60) + minutes;
};

const formatResult = async (ele,data) =>{
    let stops = data.itineraries[0].segments.length - 1;
    let html = `<img src="https://content.airhex.com/content/logos/airlines_${data.validatingAirlineCodes[0]}_60_40_r.png" alt="Airline" class="airline_logo">

            <div class="departure">
                <p class="departure_time">${formatTime(data.itineraries[0].segments[0].departure.at)}</p>
                <p class="departure_airport">${data.itineraries[0].segments[0].departure.iataCode}</p>
            </div>

            <div class="inbetween">
                <p class="flight_length">${formatLength(data.itineraries[0].duration)}</p>
                <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="inbetween_icon">
                <p class="flight_type"> Stops : ${stops}</p>
            </div>

            <div class="arrival">
                <p class="arrival_time">${formatTime(data.itineraries[0].segments[stops].arrival.at)}</p>
                <p class="arrival_airport">${data.itineraries[0].segments[stops].arrival.iataCode}</p>
            </div>

            <div class="price">

                <p class="lowest_price">Rs.${toINR(data.price.grandTotal)}</p>

                <button class="pick_btn">Pick</button>
            </div>`;
    ele.innerHTML = html;
};

const renderFlights = (flightList) => {
    flight_cards.innerHTML = "";
    

    if(flightList.length === 0) showNoResult();

    flightList.forEach((flight) => {
        let result = document.createElement("div");
        result.classList.add("result");
        formatResult(result, flight);
        result.addEventListener("click", async () => {
            flights_ToSave = saveFlight(flight);
            
            document.querySelector("#result_modal_logo").src = `https://content.airhex.com/content/logos/airlines_${flights_ToSave.airline}_60_40_r.png`;
            document.querySelector("#result_modal_dep_airport").innerText = flights_ToSave.departure_airport;
            document.querySelector("#result_modal_arr_airport").innerText = flights_ToSave.arrival_airport;
            document.querySelector("#result_modal_dep_time").innerText = flights_ToSave.departure_time;
            document.querySelector("#result_modal_arr_time").innerText = flights_ToSave.arrival_time;
            document.querySelector("#result_modal_flight_len").innerText = flights_ToSave.flight_length;
            document.querySelector("#result_modal_flight_type").innerText = `Stops : ${flights_ToSave.stops}`;

            document.querySelector("#picked_price").value = "";
            curr_price = toINR(flight.price.grandTotal);
            document.querySelector("#results_current_price").innerHTML = `<p>Current Lowest Price</p><p id="results_current_lowest_price">${curr_price}</p>`;

            pick.classList.remove("hidden");
            pick.classList.add("pick");
            backdrop.classList.remove("hidden");
        });
        flight_cards.appendChild(result);
    });
};

const sortAndFilter = () => {
    let  processed_flights = [...flights];
    let  filter_value = filter_type.value;
    if (filter_value != "all") {
        processed_flights = processed_flights.filter(val => {
            try {
                let stops = val.itineraries[0].segments.length - 1;
                let timeMins = getMinutes(formatTime(val.itineraries[0].segments[0].departure.at));
                if (filter_value === "no_stops") return stops == 0;
                if (filter_value === "early") return timeMins >= 0 && timeMins < 480;
                if (filter_value === "mid") return timeMins >= 480 && timeMins < 960;
                if (filter_value === "late") return timeMins >= 960 && timeMins <= 1440;
            } catch (error) {
                showServerError();
            }
        });
    }
    
    let sort_value = sort_type.value;

    if (sort_value === "price_low") {
        processed_flights.sort((a, b) => parseFloat(a.price.grandTotal) - parseFloat(b.price.grandTotal));
    } 
    else if (sort_value === "price_high") {
        processed_flights.sort((a, b) => parseFloat(b.price.grandTotal) - parseFloat(a.price.grandTotal));
    } 
    else if (sort_value === "duration") {
        processed_flights.sort((a, b) => getDurationMinutes(a.itineraries[0].duration) - getDurationMinutes(b.itineraries[0].duration));
    }
    no_results.classList.add("hidden");
    backdrop.classList.add("hidden");
    no_results.classList.remove("no_results");
    renderFlights(processed_flights);
};

const createResults = async () => {
    let token = await getAccessToken();
    if (!token) return;
    if (curr_view !== "results") return;
    flights = [];
    await getFlights(token, from_place.value, to_place.value, date.value);
    if (curr_view !== "results") return;
    EXR = await getExchangeRate();
    if (curr_view !== "results") return;
    result_loader.classList.add("hidden");
    result_loader.classList.remove("result_loader");
    results.classList.remove("hidden");
    sort_and_filter_sec.classList.remove("hidden");
    sort_and_filter_sec.classList.add("sortandfilter");

    sortAndFilter();
};

const updatePrice = async (token) => {
    for(let i=0;i<saved_Flights.length;i++){
        let date = saved_Flights[i].date;
        let departure_airport = saved_Flights[i].departure_airport;
        let arrival_airport = saved_Flights[i].arrival_airport;
        await getFlights(token,departure_airport,arrival_airport,date);
        for(let j=0;j<flights.length;j++){
            let stops = flights[j].itineraries[0].segments.length - 1;
            if(formatTime(flights[j].itineraries[0].segments[stops].arrival.at)==saved_Flights[i].arrival_time &&
            formatTime(flights[j].itineraries[0].segments[0].departure.at) == saved_Flights[i].departure_time){
                EXR = await getExchangeRate();
                saved_Flights[i].lowest_price = Math.min(saved_Flights[i].price,toINR(flights[j].price.grandTotal));
                saved_Flights[i].price = toINR(flights[j].price.grandTotal);
            }
        }
    }
}

const formatMyFlight = async (ele,data) =>{
    data.price<=data.picked_price ? ele.classList.add("green") : ele.classList.add("red") ;
    let html = `<img src="https://content.airhex.com/content/logos/airlines_${data.airline}_60_40_r.png" alt="Airline" class="airline_logo">

            <div class="departure">
                <p class="departure_time">${data.departure_time}</p>
                <p class="departure_airport">${data.departure_airport}</p>
            </div>

            <div class="inbetween">
                <p class="flight_length">${data.flight_length}</p>
                <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="inbetween_icon" >
                <p class="flight_type"> Stops : ${data.stops}</p>
            </div>

            <div class="arrival">
                <p class="arrival_time">${data.arrival_time}</p>
                <p class="arrival_airport">${data.arrival_airport}</p>
            </div>

            <div class="edit_sec">

                <div class="price">
                    <p class="lowest_price">Current Price:Rs.${data.price}</p>

                    <p class="picked_price">Picked Price: Rs.${data.picked_price}</p>
                </div>

                <button class="edit_btns">Edit</button>
            </div>`;
    ele.innerHTML = html;
};

const renderMyFlights = (flights) => {
    my_flights.innerHTML = "";
    flights.forEach((flight,index)=>{
        let my_flight = document.createElement("div");
        my_flight.classList.add("myFlight");
        formatMyFlight(my_flight,flight);
        my_flight.addEventListener("click",()=>{
            curr_idx = index;
            edit.classList.remove("hidden");
            backdrop.classList.remove("hidden");
            edit.classList.add("edit");
            curr_price = flight.price;
            let parent = document.querySelector("#watchlist_current_price");
            let html = `<p>Current Lowest Price<p>
                        <p id="watchlist_current_lowest_price">Rs.${curr_price}</p>`;
            parent.innerHTML = html;
            picked_price = flight.picked_price;
            parent = document.querySelector("#watchlist_your_price");
            html = `<p >Your Picked Price</p>
            <p id="curr_picked_price">Rs.${picked_price}</p>`;
            parent.innerHTML = html;
            new_price_input.value = "";
            document.querySelector("#wl_modal_logo").src = `https://content.airhex.com/content/logos/airlines_${flight.airline}_60_40_r.png`;
            document.querySelector("#wl_modal_dep_airport").innerText = flight.departure_airport;
            document.querySelector("#wl_modal_arr_airport").innerText = flight.arrival_airport;
            document.querySelector("#wl_modal_dep_time").innerText = flight.departure_time;
            document.querySelector("#wl_modal_arr_time").innerText = flight.arrival_time;
            document.querySelector("#wl_modal_flight_len").innerText = flight.flight_length;
            document.querySelector("#wl_modal_flight_type").innerText = `Stops : ${flight.stops}`;
        });
        my_flights.appendChild(my_flight);
    })
};

const createWatchlist = async () => {
    my_flights.innerHTML = "";
    if(saved_Flights.length==0) showNoWatchlist();
    else{
        let token = await getAccessToken();
        if (curr_view !== "watchlist") return;
        await updatePrice(token);
        if (curr_view !== "watchlist") return;
        watchlist_loader.classList.add("hidden");
        watchlist_loader.classList.remove("watchlist_loader");
        renderMyFlights(saved_Flights);
    }
}
const formatPastFlight = (ele,data) => {
    let html = `<img src="https://content.airhex.com/content/logos/airlines_${data.airline}_60_40_r.png" alt="Airline" class="airline_logo">

            <div class="departure">
                <p class="departure_time">${data.departure_time}</p>
                <p class="departure_airport">${data.departure_airport}</p>
            </div>

            <div class="inbetween">
                <p class="flight_length">${data.flight_length}</p>
                <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="inbetween_icon" >
                <p class="flight_type"> Stops : ${data.stops}</p>
            </div>

            <div class="arrival">
                <p class="arrival_time">${data.arrival_time}</p>
                <p class="arrival_airport">${data.arrival_airport}</p>
            </div>

            <div class="edit_sec">

                <div class="price">
                    <p class="history_last_price">Current Price:Rs.${data.price}</p>

                    <p class="history_your_price">Picked Price: Rs.${data.picked_price}</p>

                    <p class="history_lowest_price">Lowest Price: Rs.${data.lowest_price}</p>
                </div>
            </div>
            <button class="delete_btns">Delete</button>`;
    ele.innerHTML = html;
};
const renderPastFlights = (flights) => {
    past_flights_sec.innerHTML = "";
    flights.forEach((flight,index)=>{
        let past_flight = document.createElement("div");
        past_flight.classList.add("past_flight");
        formatPastFlight(past_flight,flight);
        past_flight.addEventListener("click",()=>{
            curr_idx = index;
            delete_sec.classList.remove("hidden");
            backdrop.classList.remove("hidden");
            delete_sec.classList.add("delete");
            let parent = document.querySelector("#history_last_price");
            let html = `<p>Current Price<p>
                        <p id="watchlist_current_lowest_price">Rs.${flight.price}</p>`;
            parent.innerHTML = html;
            picked_price = flight.picked_price;
            parent = document.querySelector("#history_your_price");
            html = `<p >Your Picked Price</p>
            <p id="curr_picked_price">Rs.${picked_price}</p>`;
            parent.innerHTML = html;
            parent = document.querySelector("#history_lowest_price");
            html = `<p>Lowest Price<p>
                        <p id="watchlist_current_lowest_price">Rs.${flight.lowest_price}</p>`;
            parent.innerHTML = html;
            document.querySelector("#h_modal_logo").src = `https://content.airhex.com/content/logos/airlines_${flight.airline}_60_40_r.png`;
            document.querySelector("#h_modal_dep_airport").innerText = flight.departure_airport;
            document.querySelector("#h_modal_arr_airport").innerText = flight.arrival_airport;
            document.querySelector("#h_modal_dep_time").innerText = flight.departure_time;
            document.querySelector("#h_modal_arr_time").innerText = flight.arrival_time;
            document.querySelector("#h_modal_flight_len").innerText = flight.flight_length;
            document.querySelector("#h_modal_flight_type").innerText = `Stops : ${flight.stops}`;
            document.querySelector("#h_modal_date").innerText = flight.date;
        });
        past_flights_sec.appendChild(past_flight);
    })
};

const createHistory = () => {
    past_loader.classList.add("hidden");
    past_loader.classList.remove("past_loader")
    if(past_flights.length==0) showNoPast();
    else{
        renderPastFlights(past_flights);
    }
};
const homeToResults = async() => {
    from_place.classList.remove("invalid_input");
    to_place.classList.remove("invalid_input");
    date.classList.remove("invalid_input");
    if(from_place.value.trim() == ''){
            from_place.classList.add("invalid_input");
    }
    if(to_place.value.trim() == ''){
            to_place.classList.add("invalid_input");
    }
    if(date.value == ''){
            date.classList.add("invalid_input");
    }
    if(from_place.value.trim() != '' && 
       to_place.value.trim() != '' &&
        date.value != ''){
        from_place.classList.remove("invalid_input");
        to_place.classList.remove("invalid_input");
        date.classList.remove("invalid_input");
        watchList.classList.add("hidden");
        header.classList.remove("hidden");
        header.classList.add("searching");
        results.classList.remove("hidden");
        no_results.classList.remove("no_results");
        backdrop.classList.add("hidden");
        no_results.classList.add("hidden");
        prev_view = curr_view;
        curr_view = "results";
        result_loader.classList.remove("hidden");
        result_loader.classList.add("result_loader");
        watchlist_loader.classList.add("hidden");
        watchlist_loader.classList.remove("watchlist_loader");
        results.classList.add("hidden");
        sort_and_filter_sec.classList.remove("hidden");
        sort_and_filter_sec.classList.add("sortandfilter");
        await createResults();
    }

};

const toHome = () => {
    header.classList.remove("hidden");
    header.classList.remove("searching");
    results.classList.add("hidden");
    watchList.classList.add("hidden");
    no_results.classList.remove("no_results");
    backdrop.classList.add("hidden");
    no_results.classList.add("hidden");
    sort_and_filter_sec.classList.add("hidden");
    sort_and_filter_sec.classList.remove("sortandfilter");
    result_loader.classList.add("hidden");
    result_loader.classList.remove("result_loader");
    watchlist_loader.classList.add("hidden");
    watchlist_loader.classList.remove("watchlist_loader");
    no_response.classList.remove("no_results");
    backdrop.classList.add("hidden");
    no_response.classList.add("hidden");
    history_sec.classList.add("hidden");
    history_sec.classList.remove("history_sec");
    prev_view = curr_view;
    curr_view = "home";
};

const toWatchlist = async () => {
    my_flights.innerHTML = "";
    header.classList.remove("searching");
    header.classList.add("hidden");
    result_loader.classList.add("hidden");
    result_loader.classList.remove("result_loader");
    no_watchlisted_flights.classList.add("hidden");
    no_watchlisted_flights.classList.remove("no_results");
    backdrop.classList.add("hidden");
    watchlist_loader.classList.remove("hidden");
    watchlist_loader.classList.add("watchlist_loader");
    no_results.classList.add("hidden");
    no_results.classList.remove("no_results");
    backdrop.classList.add("hidden");
    history_sec.classList.add("hidden");
    history_sec.classList.remove("history_sec");
    watchList.classList.remove("hidden");
    results.classList.add("hidden");
    no_past_flights.classList.add("hidden");
    no_past_flights.classList.remove("no_results");
    if(curr_view!="watchlist"){
        prev_view = curr_view;
        curr_view = "watchlist";
    }
    await createWatchlist();
};

const toHistory = async () => {
    history_sec.classList.remove("hidden");
    history_sec.classList.add("history_sec");
    watchList.classList.add("hidden");
    no_watchlisted_flights.classList.add("hidden");
    no_watchlisted_flights.classList.remove("no_results");
    backdrop.classList.add("hidden");
    watchlist_loader.classList.add("hidden");
    watchlist_loader.classList.remove("watchlist_loader");
    past_loader.classList.remove("hidden");
    past_loader.classList.add("past_loader")
    no_results.classList.add("hidden");
    no_results.classList.remove("no_results");
    backdrop.classList.add("hidden");

    prev_view = curr_view;
    curr_view = "history";
    setTimeout(createHistory,100);
};

const back = () =>{
    switch(prev_view){
        case "home": toHome();
            break;
        case "results": homeToResults();
            break;
        case "watchlist" : toWatchlist();
            break;
        default : toHome();
    };
}
pick_close_btn.addEventListener("click", () => {
    pick.classList.add("hidden");
    backdrop.classList.add("hidden");
    pick.classList.remove("pick");
});

pick_btn.addEventListener("click", async () => {
    let desired_price = parseInt(document.querySelector("#picked_price").value);
    if (isNaN(desired_price) || desired_price <= 0) {
        document.querySelector("#picked_price").classList.add("invalid_input");
    } else {
        flights_ToSave.picked_price = desired_price;
        flights_ToSave.date = date.value;
        saved_Flights.push(flights_ToSave);
        localStorage.setItem("my_flights", JSON.stringify(saved_Flights));
        pick.classList.add("hidden");
        backdrop.classList.add("hidden");
    }
});
edit_close_btn.addEventListener("click",()=>{
    edit.classList.add("hidden");
    backdrop.classList.add("hidden");
});
edit_btn.addEventListener("click",()=>{
    if(isNaN(parseInt(new_price_input.value)) || parseInt(new_price_input.value)<=0){
        new_picked_price.classList.add("invalid_input");
    }else{
        saved_Flights[curr_idx].picked_price = parseInt(new_price_input.value);
        edit.classList.add("hidden");
        localStorage.setItem("my_flights", JSON.stringify(saved_Flights));
        if(saved_Flights.length==0) showNoWatchlist();
        renderMyFlights(saved_Flights);
        backdrop.classList.add("hidden");
    } 
});
delete_btn.addEventListener("click",()=>{
    saved_Flights.splice(curr_idx,1);
    backdrop.classList.add("hidden");
    if(saved_Flights.length==0) showNoWatchlist();
    renderMyFlights(saved_Flights);
    edit.classList.add("hidden");
    localStorage.setItem("my_flights", JSON.stringify(saved_Flights));
});


delete_close_btn.addEventListener("click",()=>{
    delete_sec.classList.add("hidden");
    backdrop.classList.add("hidden");
});
cancel_btn.addEventListener("click",()=>{
    delete_sec.classList.add("hidden");
    backdrop.classList.add("hidden");
});
history_delete_btn.addEventListener("click",()=>{
    past_flights.splice(curr_idx,1);
    backdrop.classList.add("hidden");
    if(past_flights.length==0) showNoPast();
    renderPastFlights(past_flights);
    delete_sec.classList.add("hidden");
    localStorage.setItem("flight_history", JSON.stringify(past_flights));
});

delete_all.addEventListener("click",()=>{
    delete_all_box.classList.remove("hidden");
    backdrop.classList.remove("hidden");
    delete_all_box.classList.add("delete_all_box");
});
delete_all_cancel.addEventListener("click",()=>{
    delete_all_box.classList.add("hidden");
    backdrop.classList.add("hidden");
    delete_all_box.classList.remove("delete_all_box");
});
delete_all_btn.addEventListener("click",()=>{
    past_flights.splice(0,past_flights.length);
    backdrop.classList.add("hidden");
    if(past_flights.length==0) showNoPast();
    renderPastFlights(past_flights);
    delete_all_box.classList.add("hidden");
    delete_all_box.classList.remove("delete_all_box");
    localStorage.setItem("flight_history", JSON.stringify(past_flights));
});
sort_type.addEventListener("change", sortAndFilter);

filter_type.addEventListener("change", sortAndFilter);

watchList_btn.addEventListener("click",toWatchlist);
search_btn.addEventListener("click",homeToResults);
no_results_btn.addEventListener("click",()=>{
    no_results.classList.remove("no_results");
    backdrop.classList.add("hidden");
    no_results.classList.add("hidden");
});
no_watchlisted_flights_btn.addEventListener("click",back);
no_response_btn.addEventListener("click",toHome);
no_past_flights_btn.addEventListener("click",back);
home_btn.forEach((btn)=>{
    btn.addEventListener("click",toHome);
});
heading.addEventListener("click",toHome);
history_btn.addEventListener("click",toHistory);
watchList_title.addEventListener("click",toWatchlist);
back_btn.forEach((btn)=>{
    btn.addEventListener("click",back);
});
