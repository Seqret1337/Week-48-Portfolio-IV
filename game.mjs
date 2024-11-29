import Labyrinth from "./labyrint.mjs"
import ANSI from "./utils/ANSI.mjs";
import SplashScreen from "./splashScreen.mjs";

process.stdin.on("keypress", (str, key) => {
    if (state.completed) {
        if (key.name === 'r' || key.name === 'R') {
            state = new Labyrinth(true);
        } else if (key.name === 'q' || key.name === 'Q') {
            console.log(ANSI.SHOW_CURSOR);
            process.exit();
        }
    }
});

const REFRESH_RATE = 250;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let intervalID = null;
let isBlocked = false;
let state = null;

function init() {
    //All levels available to the game. 
    state = new SplashScreen(() => {
        state = new Labyrinth();
    });
    intervalID = setInterval(update, REFRESH_RATE);
}

function update() {

    if (isBlocked) { return; }
    isBlocked = true;
    //#region core game loop
    state.update();
    state.draw();
    //#endregion
    isBlocked = false;
}

process.on('SIGINT', () => {
    console.log(ANSI.SHOW_CURSOR);
    process.exit();
})

init();