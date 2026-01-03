import { indianAirports } from './Airports.js';
import { airlineMapping } from './Airlines.js';

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

const getFlights = async () => {
    try{
        flights = await (await fetch(URL)).json();
        console.log("Data fetched");
    }catch(error){
        console.log(error);
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

const formatResult = (ele,i) =>{
    let data = flights[i];
    let html = `<img src="https://content.airhex.com/content/logos/airlines_${airlineMapping[data.airline]}_60_40_r.png" alt="Airline" class="airline_logo">

            <div class="departure">
                <p class="departure_time">${data.departure_time}</p>
                <p class="departure_airport">${data.departure_airport}</p>
            </div>

            <div class="inbetween">
                <p class="flight_length">${data.length}</p>
                <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="inbetween_icon" height="30px" width="120px">
                <p class="flight_type"> ${data.type}</p>
            </div>

            <div class="arrival">
                <p class="arrival_time">${data.arrival_time}</p>
                <p class="arrival_airport">${data.arrival_airport}</p>
            </div>

            <div class="price">

                <p class="lowest_price">Rs.${data.lowest_price}</p>

                <button class="pick_btn">Pick</button>
            </div>`;
    ele.innerHTML = html;
};

const createResults = async () =>{
    let flag = true;
    
    await getFlights();

    results.classList.remove("loading_state");
    results.innerHTML =`<div id="pick_price" class="hidden">
            <button class="close" id="pick_close"><img src="icons/close_ic.png" alt="Close" id="cross_icon"></button>
            <div id="results_current_price">
            </div>
            
            <div id="results_your_price">
                <label for="picked_price">Pick Your Price</label>
                <input type="number" placeholder="Pick Price" id="picked_price">
            </div>
            <button id="pick_flight">Pick</button>

        </div>`;
    pick_close_btn = document.querySelector("#pick_close");
    pick_close_btn.addEventListener("click",()=>{
        let pick_sec = document.querySelector("#pick_price");
        pick_sec.classList.add("hidden");
        backdrop.classList.add("hidden");
    })   
    add_btn = document.querySelector("#pick_flight");
    add_btn.addEventListener("click",()=>{
        let desired_price = parseInt(document.querySelector("#picked_price").value);
        if(isNaN(desired_price) || desired_price<=0){
            document.querySelector("#picked_price").classList.add("invalid_input");
        }
        else{
            flights_ToSave.picked_price = desired_price;
            saved_Flights.push(flights_ToSave);
            localStorage.setItem("my_flights", JSON.stringify(saved_Flights));
            document.querySelector("#pick_price").classList.add("hidden");
            backdrop.classList.add("hidden");
        }      
    })

    for(let i=0;i<flights.length;i++){
        if(flights[i].departure_airport == from_place.value.trim().toUpperCase() && 
            flights[i].arrival_airport == to_place.value.trim().toUpperCase() &&
            flights[i].date == date.value){
            flag = false;
            let result = document.createElement("div");
            result.classList.add("result");
            formatResult(result,i);
            result.addEventListener("click",(ele)=>{
                let pick_sec = document.querySelector("#pick_price");
                pick_sec.classList.remove("hidden");
                backdrop.classList.remove("hidden");
                pick_sec.classList.add("pick");
                curr_price = flights[i].lowest_price;
                flights_ToSave = {...flights[i]};
                let parent = document.querySelector("#results_current_price");
                let html = `<p>Current Lowest Price<p>
                <p id="results_current_lowest_price">${curr_price}</p>`;
                parent.innerHTML = html;
            });
            results.appendChild(result);
        }
    }
    if(flag || flights.length==0) showNoResult();
};

const updatePrice = () => {
    for(let i=0;i<saved_Flights.length;i++){
        let Id = saved_Flights[i].id;
        for(let j of flights){
            if(j.id==Id) saved_Flights[i].lowest_price = j.lowest_price;
        }
    }
}

const formatMyFlight = (ele,i) =>{
    let data = saved_Flights[i];
    data.lowest_price<=data.picked_price ? ele.classList.add("green") : ele.classList.add("red") ;
    let html = `<img src="https://content.airhex.com/content/logos/airlines_${airlineMapping[data.airline]}_60_40_r.png" alt="Airline" class="airline_logo">

            <div class="departure">
                <p class="departure_time">${data.departure_time}</p>
                <p class="departure_airport">${data.departure_airport}</p>
            </div>

            <div class="inbetween">
                <p class="flight_length">${data.length}</p>
                <img src="icons/arrow_ic.png" alt="Arrow_Icon" class="inbetween_icon" height="30px" width="120px">
                <p class="flight_type"> ${data.type}</p>
            </div>

            <div class="arrival">
                <p class="arrival_time">${data.arrival_time}</p>
                <p class="arrival_airport">${data.arrival_airport}</p>
            </div>

            <div class="edit_sec">

                <div class="price">
                    <p class="lowest_price">Current Price:Rs.${data.lowest_price}</p>

                    <p class="picked_price">Picked Price: Rs.${data.picked_price}</p>
                </div>

                <button class="edit_btns">Edit</button>
            </div>`;
    ele.innerHTML = html;
};

const createWatchlist = async () => {
    my_flights.innerHTML =`<div id="edit" class="hidden">

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
    await getFlights();
    updatePrice();
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
            curr_price = saved_Flights[i].lowest_price;
            let parent = document.querySelector("#watchlist_current_price");
            let html = `<p>Current Lowest Price<p>
                        <p id="watchlist_current_lowest_price">Rs.${curr_price}</p>`;
            parent.innerHTML = html;
            picked_price = saved_Flights[i].picked_price;
            parent = document.querySelector("#watchlist_your_price");
            html = `<p >Your Picked Price</p>
            <p id="curr_picked_price">Rs.${picked_price}</p>`;
            parent.innerHTML = html;
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
})
no_watchlisted_flights_btn.addEventListener("click",back);

watchList_btn.addEventListener("click",createWatchlist);
heading.addEventListener("click",toHome);
back_btn.addEventListener("click",back);