import * as THREE from 'three';

export class DebugBlock {
    constructor(location, color=0xff0000, width = 1, height = 1, depth = 1) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.set(location.x, location.y, location.z);
    }
}