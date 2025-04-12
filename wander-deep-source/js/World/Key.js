import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


export class Key {
    constructor(location, playerController, gameMap, scene) {
        this.location = location;
        this.playerController = playerController;
        this.gameMap = gameMap;
        this.model = null;
        this.scene = scene;

        // Create key mesh
        const loader = new GLTFLoader();
        loader.load(
            '../../models/old_rusty_key.glb',
            (gltf) => {
                this.model = gltf.scene;

                this.model.scale.set(10, 10, 10);
                this.model.position.set(this.location.x, 3, this.location.z);
                this.model.rotation.x = -Math.PI / 2;

                // Inside your loader.load() callback, after setting up this.model
                const keyLight = new THREE.PointLight(0xffff66, 3, 20); // color, intensity, distance
                keyLight.position.set(0, 0, 0); // relative to the key model

                this.model.add(keyLight); // attach the light to the key so it moves with it
                scene.add(this.model);
            },
            undefined,
            (error) => {
                console.error('An error happened while loading the model:', error);
            }
        );
    }

    update() {
        // Hide if player touches key
        if (this.playerController && this.model && this.model.visible) {
            let keyNode = this.gameMap.quantize(this.location);
            let playerNode = this.gameMap.quantize(this.playerController.camera.position);
            if (keyNode.id === playerNode.id) {
                this.playerController.hasKey = true;
                this.model.visible = false;
            }
        }
    }
}