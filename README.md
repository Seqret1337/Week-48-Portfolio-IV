# Week-48-Portfolio-IV

functionalities added:

** The starting level has an empty slot in the surrounding wall. This slot should function as a door into the level called "aSharpPlace." Implement the door functionality so that the player can proceed to the next level.

** Create a new level (a third level) and link the unused door in "aSharpPlace" to exit into the new room.

** In "aSharpPlace," implement teleport functionality for the "♨︎" symbols. Entering one should move the player to the other.

** Ensure that when going back through a door, the player returns to the correct room.

** Make the X NPC characters perform a simple patrol (+/-2 from their starting locations).

** Create an animated splash screen (this was a group assignment from a previous week) using splashScreen.mjs.

Give the NPCs stats, such as strength and hitpoints.

Implement a simple battle system where collisions deal damage, using player and NPC stats to calculate damage dealt.

Output battle events to the event messages displayed beneath the map.

Have environment items like "◀︎" deal damage.

Have event messages remain on screen longer (currently, they only survive one update cycle).

Be able to restart or quit the game when the game is over. 