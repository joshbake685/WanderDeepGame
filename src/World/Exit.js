import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


export class Exit {
    constructor(location, playerController, gameMap, scene) {
        this.location = location;
        this.playerController = playerController;
        this.gameMap = gameMap;
        this.scene = scene;
        this.doorModel = null;
        this.padlockModel = null;
        this.lightModel = null;

        // Add spotlight
        this.spotLight = new THREE.SpotLight(0xffffff, 1, 1000, Math.PI / 2, 1);

        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;
        this.spotLight.shadow.camera.near = 0.1;
        this.spotLight.shadow.camera.far = 1000;
        this.spotLight.decay = 1;
        this.spotLight.position.set(this.location.x, 4.25, this.location.z);
        this.spotLightTarget = new THREE.Object3D();
        this.spotLightTarget.position.set(this.spotLight.position.x, 0, this.spotLight.position.z);
        this.spotLight.target = this.spotLightTarget;

        this.playedLockedSound = false;
        this.playedOpeningDoorSound = false;

        scene.add(this.spotLightTarget);
        scene.add(this.spotLight);

        // Create exit mesh
        const loader = new GLTFLoader();

        // Load the door
        loader.load(
            './models/rusty_door.glb',
            (gltf) => {
                this.doorModel = gltf.scene;

                // Set position
                this.doorModel.position.set(this.location.x, 0, this.location.z - 3);

                // Set scale
                this.doorModel.scale.set(4, 4, 4);

                // Set rotation
                this.doorModel.rotation.x = Math.PI / 2;

                // Add to scene
                this.scene.add(this.doorModel);
            },
            undefined,
            (error) => {
                console.error('An error happened while loading the model:', error);
            }
        );

        // Load the padlock
        loader.load(
            './models/rusty_steel_door_lock.glb',
            (gltf) => {
                this.padlockModel = gltf.scene;

                // Set position
                this.padlockModel.position.set(this.location.x, 0.5, this.location.z);

                // Set scale
                this.padlockModel.scale.set(1, 1, 1);

                // Set rotation
                this.padlockModel.rotation.x = -Math.PI / 2;
                this.padlockModel.rotation.z = Math.PI;

                // Add to scene
                this.scene.add(this.padlockModel);
            },
            undefined,
            (error) => {
                console.error('An error happened while loading the model:', error);
            }
        );

        // Load the overhead light
        loader.load(
            './models/industrial_wall_light.glb',
            (gltf) => {
                this.lightModel = gltf.scene;

                // Set position
                this.lightModel.position.set(this.location.x - 3, 4.25, this.location.z - 3);

                // Set scale
                this.lightModel.scale.set(0.05, 0.05, 0.05);

                // Set rotation
                this.lightModel.rotation.x = Math.PI / 2;

                // Add to scene
                this.scene.add(this.lightModel);
            },
            undefined,
            (error) => {
                console.error('An error happened while loading the model:', error);
            }
        );
    }

    update() {
        // Reaction depends on whether player has key
        if (this.playerController && this.padlockModel) {
            let keyNode = this.gameMap.quantize(this.location);
            let playerNode = this.gameMap.quantize(this.playerController.camera.position);
            if (keyNode.id === playerNode.id) {
                if (this.playerController.hasKey) {
                    // End game!
                    this.padlockModel.visible = false;
                    this.playerController.gameOver = true;
                    this.playerController.controls.unlock();
                    if (!this.playedOpeningDoorSound) {
                        this.playedOpeningDoorSound = true;
                        this.playerController.openingDoorSound?.play();
                    }
                    setTimeout(() => {
                        this.playerController.showEndScreen("YOU ESCAPED", "Play again");
                    }, 3500);
                } else {
                    // Play lock sound
                    if (!this.playedLockedSound) {
                        this.playedLockedSound = true;
                        this.playerController.doorLockedSound?.play();
                    }
                }
            } else {
                this.playedLockedSound = false;
            }
        }
    }
}