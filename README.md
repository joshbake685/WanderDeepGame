# Wander Deep
Three.js project files for COMP-4303 final project.

## Description
The player is trapped in a procedurally generated dungeon and must escape. There is a monster wandering around the dungeon that the player must avoid while they attempt to escape. The player will escape by finding a key and using it to unlock a door located somewhere else in the dungeon.  
The monster can only see you if it is facing you, and can only hear you if you run while he is nearby. If it hears you or sees you briefly, it will pursue you until it reaches you or you can stay out of sight for long enough. If it reaches you, the game ends. The game also ends if you reach the door after getting the key.  

## How to run
From the project root:  
1. cd "docs"
2. If not installed already:  
npm install three  
npm install vite  
3. npx vite  
4. Open the displayed link in a web browser  
5. Click anywhere on the opened page to start controlling the player  

## Controls
The player moves with WASD and runs by holding the SHIFT key. Use the mouse to look around. All interacts with objects occur from the player touching it; no input necessary. The player has limited stamina, which runs out as they run. It regenerates slowly as the player walks, and faster when they stand still. A button will appear when the monster reaches you or you reach the exit with the key, allowing you to restart the game. The game can also be restarted by refreshing the page.

## Topics implemented
### Complex Movement Algorithms
- The monster uses simple path following when wandering or pursuing the player.  

### Decision Making
- The monster uses a simple Finite State Machine (FSM) to switch between wandering, pursuing the player, and seeking to them when in a direct line of sight.  
- The player's movement/stamina is controlled by a hierarchical FSM. The player can run continuously until a counter reaches 0, at which point they will be forced to stop and move slowly until enough stamina regenerates. The high-level states are "idle" and "moving", while the low-level states are "walking", "running", and "slow".  

### Pathfinding
- The monster uses Jump Point Search (JPS) to find paths to random locations when wandering, and to find a path to the player when pursuing.

### Procedural content generation
- The dungeon is randomly generated using the procedural dungeon generation algorithm.

### Extra Topics
- The wall collision algorithms are custom.  
- The algorithm for detecting whether the player is in a direct line of sight of the monster (i.e. no obstacles obscuring the monster's view and the player is within its FOV) is custom.
- Dijkstra's algorithm was used to find the farthest node (room node, not ground node) from the player's spawn node so the player will have to explore most of the dungeon to find it.

# External assets
## Audio
Dark Dungeon Ambience: https://freesound.org/people/Kinoton/sounds/516566/  
Player walk sound: https://pixabay.com/sound-effects/footsteps-in-a-hallway-47842/  
Player run sound: https://pixabay.com/sound-effects/person-running-loop-245173/  
Player heavy breathing: https://pixabay.com/sound-effects/heavy-breathing-sound-effect-type-02-294195/  
Monster walk sound: https://pixabay.com/sound-effects/loud-footsteps-62038/  
Monster growl close: https://pixabay.com/sound-effects/deep-monster-growl-86780/  
Monster growl distant: https://pixabay.com/sound-effects/monster-growl-6311/  
Monster roar: https://pixabay.com/sound-effects/tiger-roar-loudly-193229/  
Get key: https://pixabay.com/sound-effects/key-get-39925/  
Open door: https://pixabay.com/sound-effects/metal-warehouse-door-opened-with-chains-100823/  
Locked door: https://pixabay.com/sound-effects/door-lock-82542/  
Death sound: https://pixabay.com/sound-effects/dramatic-synth-echo-43970/  

## Models
Monster model (animated with Mixamo): https://www.fab.com/listings/1833cf26-fa46-419e-b482-67859fe20bc6  
Key model: https://www.fab.com/listings/33f9b4a3-a495-4db7-aeb0-69d9f93fa907  

## Textures
Wall material: https://polyhaven.com/a/castle_wall_varriation  
Floor material: https://polyhaven.com/a/floor_bricks_02  
Ceiling material: https://polyhaven.com/a/cracked_concrete_wall  
