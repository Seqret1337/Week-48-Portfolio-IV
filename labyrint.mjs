import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";
import oscillate from "./utils/oscilate.mjs";


const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();

const levelStates = {};

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

let currentLevel = startingLevel;
let levelData = readMapFile(levels[startingLevel]);
let level = levelData;
levelStates[currentLevel] = level;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
}


let isDirty = true;

let playerPos = {
    row: null,
    col: null,
}

const EMPTY = " ";
const HERO = "H";
const LOOT = "$"
const NPC = "X";
const WALL = "█";

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    chash: 0
}

let npcs = [];
class NpcPatrol {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.startCol = col;
        this.horizontalPattern = oscillate(col -2, col +2);
        this.verticalPattern = oscillate(row -2, row +2);
        this.movingVertically = false;
    }

    canMoveTo(row, col) {
        return level[row][col] === EMPTY;
    }

    update() {
        if (!this.movingVertically) {
            let oldCol = this.col;

            let desiredCol = this.horizontalPattern();
        
            let step = Math.sign(desiredCol - this.col);
            let newCol = this.col + step;

            if (!this.canMoveTo(this.row, newCol)) {
                this.movingVertically = true;
                return false;
            }

            level[this.row][oldCol] = EMPTY;
            this.col = newCol;
            level[this.row][this.col] = NPC;
            return true;
        } else {
            let oldRow = this.row;
            let desiredRow = this.verticalPattern();
            let step = Math.sign(desiredRow - this.row);
            let newRow = this.row + step;

            if (!this.canMoveTo(newRow, this.col)) {
                this.movingVertically = false;
                return false;
            }

            level[oldRow][this.col] = EMPTY;
            this.row = newRow;
            level[this.row][this.col] = NPC;
            return true;
        }
    }
}

function findNPCs() {
    npcs = [];
    for (let row = 0; row < level.length; row++) {
        for (let col = 0; col < level[row].length; col++) {
            if (level[row][col] === NPC) {
                npcs.push(new NpcPatrol(row, col));
            }
        }
    }
}
class Labyrinth {

    update() {

        if (playerPos.row == null) {
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == "H") {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
            findNPCs();
        }

        let npcMoved = false;
        for (let npc of npcs) {
            if (npc.update()) {
                npcMoved = true;
            }
        }
        if (npcMoved) {
            isDirty = true;
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
        }

        let tRow = playerPos.row + (1 * drow);
        let tcol = playerPos.col + (1 * dcol);

        if (currentLevel === startingLevel && tcol === level[0].length - 1 && tRow === 2) {
            levelStates[currentLevel] = level.map(row => [...row]);
            currentLevel = "aSharpPlace";

            if (!levelStates[currentLevel]) {
                levelStates[currentLevel] = readMapFile(levels[currentLevel]);
            }
            level = levelStates[currentLevel].map(row => [...row]);
            level[2][0] = EMPTY;
            playerPos.row = 2;
            playerPos.col = 1;
            findNPCs();
            isDirty = true;
            eventText = "You made it to the next level";
            return;
        } else if (currentLevel === "aSharpPlace" && tcol === 0 && tRow == 2) {
            levelStates[currentLevel] = level.map(row => [...row]);
            currentLevel = startingLevel;

            level = levelStates[currentLevel].map(row => [...row]);
            level[6][4] = EMPTY;  
            playerPos.row = 2;
            playerPos.col = level[0].length - 2;
            findNPCs();
            isDirty = true;
            eventText = "Returned to first level";
            return;
        }

        if (THINGS.includes(level[tRow][tcol])) { // Is there anything where Hero is moving to

            let currentItem = level[tRow][tcol];
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.chash += loot;
                eventText = `Player gained ${loot}$`;
            }

            // Move the HERO
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tcol] = HERO;

            // Update the HERO
            playerPos.row = tRow;
            playerPos.col = tcol;

            // Make the draw function draw.
            isDirty = true;
        } else {
            direction *= -1;
        }
    }

    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendring = "";

        rendring += renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendring += rowRendering;
        }

        console.log(rendring);
        if (eventText != "") {
            console.log(eventText);
            eventText = "";
        }
    }
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `$:${playerStats.chash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}


export default Labyrinth;