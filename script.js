import { indianAirports } from './Airports.js';
import { clientId, clientSecret } from './config.js';

let search_btn = document.querySelector("#search_btn");
let header = document.querySelector("header");
let results = document.querySelector("#results");
let heading = document.querySelector("h1");
let watchList = document.querySelector("#watchlist_sec");
let watchList_btn = document.querySelector("#watchlist_btn");
let my_flights = document.querySelector("#my_flights");
let back_btn = document.querySelector("#back_btn");
let from_place = document.querySelector("#from_place");
let to_place = document.querySelector("#to_place");
let date = document.querySelector("#from_date");
let datalist = document.querySelector("datalist");
let no_results = document.querySelector("#no_results");
let no_results_btn = document.querySelector("#no_results_btn");
let no_watchlisted_flights = document.querySelector("#no_watchlisted_flights");
let no_watchlisted_flights_btn = document.querySelector("#no_watchlisted_flights_btn");
let backdrop = document.querySelector("#modal_backdrop");
let EXR = 1;
let add_btn = null;
let edit_btn = null;
let delete_btn = null;
let pick_close_btn = null;
let edit_close_btn = null;
let curr_idx = null;
let prev_view = null;
let curr_price = null;
let picked_price = null;
let curr_view = "home";
let URL = `https://695236123b3c518fca11d4bb.mockapi.io/flightsapi/pp/flights`;


(async () =>{
    datalist.innerHTML = "";
    for(let i of indianAirports){
        let html = `<option value="${Object.values(i)[0]}">${Object.keys(i)[0]}</option>`;
        datalist.innerHTML += html;
    }
})();

let flights = [];

let flights_ToSave = null;

let saved_Flights = JSON.parse(localStorage.getItem("my_flights")) || [];

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
        }else console.log("Bad Request");
    }catch(error){
        console.log(error);
    }
}

const getExchangeRate = async () => {
    let res = await fetch(`https://v6.exchangerate-api.com/v6/f8afdba7273ffb8cc3d85343/latest/EUR`);
    let data = await res.json();
    return data.conversion_rates["INR"]
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
        }else showNoResult();
    }catch(error){
        alert("Bad Request");
    }
}

const showNoResult = () => {
    no_results.classList.remove("hidden");
    no_results.classList.add("no_results");
};

const showNoWatchlist = () => {
    no_watchlisted_flights.classList.remove("hidden");
    no_watchlisted_flights.classList.add("no_results");
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
        "stops" : stops
    };
}

const formatResult = async (ele,i) =>{
    let data = flights[i];
    let stops = data.itineraries[0].segments.length - 1;
    let html = `<img src="https://content.airhex.com/content/logos/airlines_${data.validatingAirlineCodes[0]}_60_40_r.png" alt="Airline" class="airline_logo">

            <div class="departure">
                <p class="departure_time">${formatTime(data.itineraries[0].segments[0].departure.at)}</p>
                <p class="departure_airport">${data.itineraries[0].segments[0].departure.iataCode}</p>
            </div>

            <div class="inbetween">
                <p class="flight_length">${formatLength(data.itineraries[0].duration)}</p>
                <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="inbetween_icon" height="30px" width="120px">
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

const createResults = async () =>{
    let token = await getAccessToken();
    await getFlights(token, from_place.value , to_place.value , date.value);
    EXR = await getExchangeRate();

    results.classList.remove("loading_state");
    results.innerHTML =`<div id="pick_price" class="hidden">
            <div class="modal_ticket">
                <img class="modal_logo airline_logo" id="result_modal_logo" src="" alt="Airline">
                <div class="modal_dep">
                    <p class="modal_dep_time" id="result_modal_dep_time"></p>
                    <p class="modal_dep_airport" id="result_modal_dep_airport"></p>
                </div>

                <div class="modal_inbetween">
                    <p class="modal_flight_len" id="result_modal_flight_len"></p>
                    <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="modal_inbtw_icon" height="30px" width="120px">
                    <p class="modal_flight_type" id="result_modal_flight_type"></p>
                </div>

                <div class="modal_arr">
                    <p class="modal_arr_time" id="result_modal_arr_time"></p>
                    <p class="modal_arr_airport" id="result_modal_arr_airport"></p>
                </div>
            </div>
            <div id="select_price">
                <button class="close" id="pick_close"><img src="icons/close_ic.png" alt="Close" id="cross_icon"></button>
                <div id="results_current_price">
                </div>
            
                <div id="results_your_price">
                    <label for="picked_price">Pick Your Price</label>
                    <input type="number" placeholder="Pick Price" id="picked_price">
                </div>
                <button id="pick_flight">Pick</button>
            </div>
        </div>`;
    pick_close_btn = document.querySelector("#pick_close");
    pick_close_btn.addEventListener("click",()=>{
        let pick_sec = document.querySelector("#pick_price");
        pick_sec.classList.add("hidden");
        backdrop.classList.add("hidden");
    })   
    add_btn = document.querySelector("#pick_flight");
    add_btn.addEventListener("click",async()=>{
        let desired_price = parseInt(document.querySelector("#picked_price").value);
        if(isNaN(desired_price) || desired_price<=0){
            document.querySelector("#picked_price").classList.add("invalid_input");
        }
        else{
            flights_ToSave.picked_price = desired_price;
            flights_ToSave.date = date.value;
            saved_Flights.push(flights_ToSave);
            localStorage.setItem("my_flights", JSON.stringify(saved_Flights));
            document.querySelector("#pick_price").classList.add("hidden");
            backdrop.classList.add("hidden");
        }      
    })

    for(let i=0;i<flights.length;i++){
        if(flights.length==0) showNoResult();
        else{
            let result = document.createElement("div");
            result.classList.add("result");
            formatResult(result,i);
            result.addEventListener("click",async (ele)=>{
                let pick_sec = document.querySelector("#pick_price");
                pick_sec.classList.remove("hidden");
                backdrop.classList.remove("hidden");
                pick_sec.classList.add("pick");
                let picked_price = document.querySelector("#picked_price");
                picked_price.value = null;
                curr_price = toINR(flights[i].price.grandTotal);
                flights_ToSave = saveFlight(flights[i]);
                document.querySelector("#result_modal_logo").src = `https://content.airhex.com/content/logos/airlines_${flights_ToSave.airline}_60_40_r.png`;
                document.querySelector("#result_modal_dep_airport").innerText = flights_ToSave.departure_airport;
                document.querySelector("#result_modal_arr_airport").innerText = flights_ToSave.arrival_airport;
                document.querySelector("#result_modal_dep_time").innerText = flights_ToSave.departure_time;
                document.querySelector("#result_modal_arr_time").innerText = flights_ToSave.arrival_time;
                document.querySelector("#result_modal_flight_len").innerText = flights_ToSave.flight_length;
                document.querySelector("#result_modal_flight_type").innerText = `Stops : ${flights_ToSave.stops}`;
                let parent = document.querySelector("#results_current_price");
                let html = `<p>Current Lowest Price<p>
                <p id="results_current_lowest_price">${curr_price}</p>`;
                parent.innerHTML = html;
            });
            results.appendChild(result);
        }
    }
    
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
                saved_Flights[i].price = toINR(flights[j].price.grandTotal);
            }
        }
    }
}

const formatMyFlight = async (ele,i) =>{
    let data = saved_Flights[i];
    toINR(data.price)<=data.picked_price ? ele.classList.add("green") : ele.classList.add("red") ;
    let html = `<img src="https://content.airhex.com/content/logos/airlines_${data.airline}_60_40_r.png" alt="Airline" class="airline_logo">

            <div class="departure">
                <p class="departure_time">${data.departure_time}</p>
                <p class="departure_airport">${data.departure_airport}</p>
            </div>

            <div class="inbetween">
                <p class="flight_length">${data.flight_length}</p>
                <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="inbetween_icon" height="30px" width="120px">
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

const createWatchlist = async () => {
    my_flights.innerHTML =`<div id="edit" class="hidden">
            <div class="modal_ticket">
                <img class="modal_logo airline_logo" id="wl_modal_logo" src="" alt="Airline">
                <div class="modal_dep">
                    <p class="modal_dep_time" id="wl_modal_dep_time"></p>
                    <p class="modal_dep_airport" id="wl_modal_dep_airport"></p>
                </div>

                <div class="modal_inbetween">
                    <p class="modal_flight_len" id="wl_modal_flight_len"></p>
                    <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="modal_inbtw_icon" height="30px" width="120px">
                    <p class="modal_flight_type" id="id_modal_flight_type"></p>
                </div>

                <div class="modal_arr">
                    <p class="modal_arr_time" id="wl_modal_arr_time"></p>
                    <p class="modal_arr_airport" id="wl_modal_arr_airport"></p>
                </div>
            </div>
            <div id="update">
                <div class="prices">

                    <div id="watchlist_current_price">
                    </div>
            
                    <div id="watchlist_your_price">
                    </div>

                    <div id="new_price">

                        <label for="new_picked_price">Update Price</label>
                        <input type="number" placeholder="Pick Price" id="new_picked_price">
                    </div>
                </div>

                <div id="edit_btns">

                    <button id="edit_btn">Edit</button>

                    <button id="delete_btn">Delete</button>
                </div>

                <button class="close" id="edit_close"><img src="icons/close_ic.png" alt="Close" id="cross_icon"></button>
            </div>    
        </div>`;
    edit_close_btn = document.querySelector("#edit_close");
    edit_close_btn.addEventListener("click",()=>{
        let edit = document.querySelector("#edit");
        edit.classList.add("hidden");
        backdrop.classList.add("hidden");
    })  
    edit_btn = document.querySelector("#edit_btn");
    edit_btn.addEventListener("click",()=>{
        let new_picked_price = document.querySelector("#new_picked_price");
        if(isNaN(parseInt(new_picked_price.value)) || parseInt(new_picked_price.value)<=0){
            new_picked_price.classList.add("invalid_input");
        }else{
            saved_Flights[curr_idx].picked_price = parseInt(new_picked_price.value);
            document.querySelector("#edit").classList.add("hidden");
            localStorage.setItem("my_flights", JSON.stringify(saved_Flights));
            createWatchlist();
            backdrop.classList.add("hidden");
        } 
    })
    delete_btn = document.querySelector("#delete_btn");
    delete_btn.addEventListener("click",()=>{
        saved_Flights.splice(curr_idx,1);
        backdrop.classList.add("hidden");
        createWatchlist();
        document.querySelector("#edit").classList.add("hidden");
        localStorage.setItem("my_flights", JSON.stringify(saved_Flights));
    })
    if(saved_Flights.length==0) showNoWatchlist();
    let token = await getAccessToken();
    await updatePrice(token);
    for(let i=0;i<saved_Flights.length;i++){
        let my_flight = document.createElement("div");
        my_flight.classList.add("myFlight");
        formatMyFlight(my_flight,i);
        my_flight.addEventListener("click",(ele)=>{
            let edit = document.querySelector("#edit");
            edit.classList.remove("hidden");
            backdrop.classList.remove("hidden");
            edit.classList.add("edit");
            curr_idx = i;
            curr_price = saved_Flights[i].price;
            let parent = document.querySelector("#watchlist_current_price");
            let html = `<p>Current Lowest Price<p>
                        <p id="watchlist_current_lowest_price">Rs.${curr_price}</p>`;
            parent.innerHTML = html;
            picked_price = saved_Flights[i].picked_price;
            parent = document.querySelector("#watchlist_your_price");
            html = `<p >Your Picked Price</p>
            <p id="curr_picked_price">Rs.${picked_price}</p>`;
            parent.innerHTML = html;
            document.querySelector("#wl_modal_logo").src = `https://content.airhex.com/content/logos/airlines_${saved_Flights[i].airline}_60_40_r.png`;
            document.querySelector("#wl_modal_dep_airport").innerText = saved_Flights[i].departure_airport;
            document.querySelector("#wl_modal_arr_airport").innerText = saved_Flights[i].arrival_airport;
            document.querySelector("#wl_modal_dep_time").innerText = saved_Flights[i].departure_time;
            document.querySelector("#wl_modal_arr_time").innerText = saved_Flights[i].arrival_time;
            document.querySelector("#wl_modal_flight_len").innerText = saved_Flights[i].flight_length;
            document.querySelector("#wl_modal_flight_type").innerText = `Stops : ${saved_Flights[i].stops}`;
        });
        my_flights.appendChild(my_flight);
    }
}

const homeToResults = () => {
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
        no_results.classList.add("hidden");
        prev_view = curr_view;
        curr_view = "results";
        results.classList.add("loading_state");
        results.innerHTML = "";
        results.innerText = "Getting Flights.....";
        setTimeout(async () => {
            await createResults();
        }, 100);
    }

};

const toHome = () => {
    header.classList.remove("hidden");
    header.classList.remove("searching");
    results.classList.add("hidden");
    watchList.classList.add("hidden");
    no_results.classList.remove("no_results");
    no_results.classList.add("hidden");
    prev_view = curr_view;
    curr_view = "home";
};

const toWatchlist =() => {
    watchList.classList.remove("hidden");
    results.classList.add("hidden");
    header.classList.remove("searching");
    header.classList.add("hidden");
    prev_view = curr_view;
    curr_view = "watchlist";
};

const back = () =>{
    switch(prev_view){
        case "home": toHome();
                    break;
        case "results": homeToResults();
                        break;
    };
}

watchList_btn.addEventListener("click",toWatchlist);
search_btn.addEventListener("click",homeToResults);
no_results_btn.addEventListener("click",()=>{
    no_results.classList.remove("no_results");
    no_results.classList.add("hidden");
});
no_watchlisted_flights_btn.addEventListener("click",back);

watchList_btn.addEventListener("click",createWatchlist);
heading.addEventListener("click",toHome);
back_btn.addEventListener("click",back);