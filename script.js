const clamButton = document.getElementById("clamButton");
const clamResult = document.getElementById("clamResult");

const clams = [
    "🦪 You found a Fancy Clam!",
    "🦪 You found a Giant Clam!",
    "🦪 You found a Happy Clam!",
    "🦪 You found a Sneaky Clam!",
    "🦪 You found a Legendary Clam!",
    "🦪 You found the Supreme Clam!"
];

clamButton.addEventListener("click", function () {

    const randomNumber = Math.floor(Math.random() * clams.length);

    clamResult.textContent = clams[randomNumber];

});