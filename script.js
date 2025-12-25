let search_btn = document.querySelector("#search_btn");
let header = document.querySelector("header");
let results = document.querySelector("#results");

const homeToResults = () => {
    header.classList.add("searching");
    results.classList.remove("hidden");
};

search_btn.addEventListener("click",homeToResults);