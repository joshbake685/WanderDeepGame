import { DebugBlock } from '../../DebugBlock';
import { MathUtil } from '../Util/MathUtil';


export class DummyPlayer {
    constructor(location, monster, gameMap) {
        this.monster = monster;
        this.gameMap = gameMap;
        this.camera = new DummyCamera(location);
        this.debugBlock = new DebugBlock(location, 0xff00ff, 4, 4, 4);
        this.runSpeed = 10;
        this.velocity = this.runSpeed;
    }

    update() {
        let monsterNode = this.gameMap.quantize(this.monster.location);
        let playerNode = this.gameMap.quantize(this.camera.position);
        if (playerNode.id === monsterNode.id) {
            const randomIndex = MathUtil.getRandomInt(0, this.gameMap.dungeonGenerator.leafRooms.length);
            let newRoom = this.gameMap.dungeonGenerator.leafRooms[randomIndex];
            let newPosition = this.gameMap.dungeonGenerator.roomCoordsToWorld(newRoom);

            // Set position to new location
            this.camera.position.set(newPosition.x, 0, newPosition.z);
            this.debugBlock.mesh.position.set(newPosition.x, 0, newPosition.z);
        }
    }
}

class DummyCamera {
    constructor(location) {
        this.position = location;
    }
}