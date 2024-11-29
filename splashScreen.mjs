import { start } from "repl";
import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import Text from "./utils/superText.mjs";

const outputGraphics = `
 ██▓    ▄▄▄       ▄▄▄▄ ▓██   ██▓ ██▀███   ██▓ ███▄    █ ▄▄▄█████▓ ██░ ██
▓██▒   ▒████▄    ▓█████▄▒██  ██▒▓██ ▒ ██▒▓██▒ ██ ▀█   █ ▓  ██▒ ▓▒▓██░ ██▒
▒██░   ▒██  ▀█▄  ▒██▒ ▄██▒██ ██░▓██ ░▄█ ▒▒██▒▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▀▀██░
▒██░   ░██▄▄▄▄██ ▒██░█▀  ░ ▐██▓░▒██▀▀█▄  ░██░▓██▒  ▐▌██▒░ ▓██▓ ░ ░▓█ ░██
░██████▒▓█   ▓██▒░▓█  ▀█▓░ ██▒▓░░██▓ ▒██▒░██░▒██░   ▓██░  ▒██▒ ░ ░▓█▒░██▓
░ ▒░▓  ░▒▒   ▓▒█░░▒▓███▀▒ ██▒▒▒ ░ ▒▓ ░▒▓░░▓  ░ ▒░   ▒ ▒   ▒ ░░    ▒ ░░▒░▒
░ ░ ▒  ░ ▒   ▒▒ ░▒░▒   ░▓██ ░▒░   ░▒ ░ ▒░ ▒ ░░ ░░   ░ ▒░    ░     ▒ ░▒░ ░
  ░ ░    ░   ▒    ░    ░▒ ▒ ░░    ░░   ░  ▒ ░   ░   ░ ░   ░       ░  ░░ ░
    ░  ░     ░  ░ ░     ░ ░        ░      ░           ░           ░  ░  ░
                       ░░ ░
`;

const pressEnterText = "Press ENTER to start";
const colors = [
    ANSI.COLOR.YELLOW,
    ANSI.COLOR.GREEN,
    ANSI.COLOR.BLUE,
    ANSI.COLOR.LIGHT_GRAY,
    ANSI.COLOR.WHITE,
    ANSI.COLOR.BLACK
];

class SplashScreen {

    constructor(onComplete) {
        this.onComplete = onComplete;
        this.dirty = true;
        this.colorIndex = 0;
        this.frame = 0;
        this.showPressEnter = true;
        this.graphicsLines = outputGraphics.split("\n").filter(line => line.length > 0);
        this.completed = false;
    }

    update() {
        if (this.completed) return;

        this.dirty = true;
        this.frame++;

        if (this.frame % 5 === 0) {
            this.colorIndex = (this.colorIndex + 1) % colors.length;
        }

        if (KeyBoardManager.isEnterPressed()) {
            this.completed = true;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    drawText(line, row) {
        let result = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '█') {
                result += colors[this.colorIndex] + char + ANSI.RESET;
            } else {
                result += ANSI.COLOR.RED + char + ANSI.RESET;
            }
        }

        const terminalWidth = process.stdout.columns || 80;
        const textStartCol = Math.floor((terminalWidth - line.length) / 2);
        console.log(ANSI.moveCursorTo(row, textStartCol), result);
    }

    draw() {
        if (!this.dirty) return;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
        const terminalHeight = process.stdout.rows || 24;
        const contentHeight = this.graphicsLines.length + 2;
        const startRow = Math.max(0, Math.floor((terminalHeight - contentHeight) / 2));

        this.graphicsLines.forEach((line,index) => {
            this.drawText(line, startRow + index);
        });
        
        if (this.showPressEnter) {
            const textStartCol = Math.floor((process.stdout.columns - pressEnterText.length) / 2);
            console.log(
                ANSI.moveCursorTo(startRow + this.graphicsLines.length + 1, textStartCol),
                ANSI.COLOR.WHITE,
                pressEnterText,
                ANSI.RESET
            );
        }
    }
}

export default SplashScreen;