import * as THREE from 'three';

export class Key {
    constructor(location, playerController, gameMap) {
        this.location = location;
        this.playerController = playerController;
        this.gameMap = gameMap;

        // Create key mesh
        const geometry = new THREE.SphereGeometry(5, 64, 32);   // Placeholder
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.set(location.x, location.y, location.z);
    }

    update() {
        // Hide if player touches key
        if (this.mesh.visible) {
            let keyNode = this.gameMap.quantize(this.location);
            let playerNode = this.gameMap.quantize(this.playerController.camera.position);
            if (keyNode.id === playerNode.id) {
                this.playerController.hasKey = true;
                this.mesh.visible = false;
            }
        }
    }
}