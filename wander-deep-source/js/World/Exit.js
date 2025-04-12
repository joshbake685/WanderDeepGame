import * as THREE from 'three';

export class Exit {
    constructor(location, playerController, gameMap) {
        this.location = location;
        this.playerController = playerController;
        this.gameMap = gameMap;

        // Create exit mesh
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);   // Placeholder
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.set(location.x, location.y, location.z);
    }

    update() {
        // Reaction depends on whether player has key
        let keyNode = this.gameMap.quantize(this.location);
        let playerNode = this.gameMap.quantize(this.playerController.camera.position);
        if (keyNode.id === playerNode.id) {
            if (this.playerController.hasKey) {
                // End game!
                console.log("Game over!");
            } else {
                // Play lock sound, show message, etc.
                console.log("Player needs key!");
            }
        }
    }
}