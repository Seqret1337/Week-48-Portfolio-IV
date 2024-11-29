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
    "♨": ANSI.COLOR.BLUE
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
const TELEPORTER = "♨";
const LEFTSPIKE = "◀︎";
const RIGHTSPIKE = "►";

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY, TELEPORTER, LEFTSPIKE, RIGHTSPIKE];

let eventText = "";

const HP_MAX = 10;

let playerStats = {
    hp: 8,
    chash: 0,
    strength: 3,
    isAlive: true
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

        this.stats = {
            hp: Math.floor(Math.random()* 10) + 1,
            isAlive: true,
            strength: Math.floor(Math.random() * 2) + 1
        };
    }

    canMoveTo(row, col) {
        return level[row][col] === EMPTY && this.stats.isAlive;
    }

    takeDamage(amount) {
        this.stats.hp -= amount;
        if (this.stats.hp <= 0) {
            this.stats.isAlive = false;
            level[this.row][this.col] = EMPTY;
            return true;
        }
        return false;
    }

    update() {
        if (!this.stats.isAlive) return false;

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
    constructor(reset = false) {
        if (reset) {
            level = readMapFile(levels[startingLevel]);
            playerPos = {row: null, col: null };
            currentLevel = startingLevel;
            playerStats = {hp: 8, chash: 0, strength: 5, isAlive: true };
            npcs = [];
            isDirty = true;
        }

        this.messageTimer = 0;
        this.messageDisplayTime = 20;
        this.dirty = false;
        this.completed = false;
    }

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
        if (this.completed) return;

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

        let npc = npcs.find(n => n.row === tRow && n.col === tcol && n.stats.isAlive);
        if (npc) {
            npc.takeDamage(playerStats.strength);
            if (!npc.stats.isAlive) {
                eventText = "Defeated an Enemy!";
            } else {
                playerStats.hp -= npc.stats.strength;
                eventText = `You dealt ${playerStats.strength} damage and took ${npc.stats.strength} damage!`;

                if (playerStats.hp <= 0) {
                    playerStats.isAlive = false;
                    this.completed = true;
                    return;
                }
            }
            this.dirty = true;
            return;
        }



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
            level[2][1] = EMPTY;  
            playerPos.row = 2;
            playerPos.col = level[0].length - 2;
            findNPCs();
            isDirty = true;
            eventText = "Returned to first level";
            return;
        } else if (currentLevel === "aSharpPlace" && tcol === 16 && tRow === 15) {
            levelStates[currentLevel] = level.map(row => [...row]);
            currentLevel = "treasure";

            if (!levelStates[currentLevel]) {
                levelStates[currentLevel] = readMapFile(levels[currentLevel]);
            }

            level = levelStates[currentLevel].map(row => [...row]);
            level[6][4] = EMPTY;  
            playerPos.row = 4;
            playerPos.col = 18;
            findNPCs();
            isDirty = true;
            eventText = "You found the treasure room!";
            return;
        } else if (currentLevel === "treasure" && tcol === 19 && tRow === 4) {
            currentLevel = "aSharpPlace";
            level = levelStates[currentLevel].map(row => [...row]);
            playerPos.row = 14;
            playerPos.col = 16;
            findNPCs();
            isDirty = true;
            eventText = "Returned to second level";
            return;
        }

        if (THINGS.includes(level[tRow][tcol])) { // Is there anything where Hero is moving to
            let currentItem = level[tRow][tcol];

            if (currentItem === LEFTSPIKE || currentItem === RIGHTSPIKE) {
                playerStats.hp -= 2;
                eventText = "You took 2 damage from touching the spikes";

                if (playerStats.hp <= 0) {
                    playerStats.isAlive = false;
                    this.completed = true;
                    return;
                }
            }

            

            if (currentItem === TELEPORTER) {
                let otherTeleporter = this.findOtherTeleporter(tRow, tcol);
                if (otherTeleporter) {
                    level[playerPos.row][playerPos.col] = EMPTY;
                    level[otherTeleporter.row + 1][otherTeleporter.col] = HERO;
                    playerPos.row = otherTeleporter.row + 1;
                    playerPos.col = otherTeleporter.col;
                    isDirty = true;
                    eventText = "You teleported!";
                    return;
                }
            }
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

    findOtherTeleporter(currentRow, currentCol) {
        for (let row = 0; row < level.length; row++) {
            for (let col = 0; col < level[row].length; col++) {
                if (level[row][col] === TELEPORTER && (row !== currentRow || col !== currentCol)) {
                    return {row,col};
                }
            }
        }
        return null;
    }

    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendring = "";
        rendring += renderHud();

        const terminalHeight = process.stdout.rows || 24;
        const levelHeight = level.length;
        const startRow = Math.max(0, Math.floor((terminalHeight - levelHeight) / 2));

        const terminalWidth = process.stdout.columns || 80;
        const levelWidth = level[0].length;
        const padding = " ".repeat(Math.max(0, Math.floor(terminalWidth - levelWidth) / 2));

        console.log(ANSI.moveCursorTo(startRow, 0));

        for (let row = 0; row < level.length; row++) {
            let rowRendering = padding;
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
            this.messageTimer = this.messageDisplayTime;
        }
        if (this.messageTimer > 0) {
            console.log(eventText);
            this.messageTimer--;
        }
        if (this.completed) {
            console.log("Game Over!")
            console.log("\nPress R to restart or Q to quit");
        }
    }
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `$:${playerStats.chash}`;
    let strength = `STR:${playerStats.strength}`;
    return `${hpBar} ${cash} ${strength}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}


export default Labyrinth;