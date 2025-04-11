import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BaseCameraController } from './BaseCameraController';

export class OrbitCameraController extends BaseCameraController {
    constructor(document, renderer) {
        super(document, renderer);
        this.controls = new OrbitControls(this.camera, renderer.domElement);

        // Set initial values for camera
        this.camera.position.y = 180;
        this.camera.position.z = 50;
        this.camera.lookAt(0, 0, 0);
    }

    update(delta) {
        
    }
}