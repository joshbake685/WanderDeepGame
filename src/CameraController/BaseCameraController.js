import * as THREE from 'three';

// Base class for orbit and first person cameras
export class BaseCameraController {
    constructor(document, renderer) {
        this.document = document;
        this.renderer = renderer;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    }

    update(delta) {

    }
}