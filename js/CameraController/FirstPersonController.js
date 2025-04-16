import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { BaseCameraController } from './BaseCameraController';
import { MathUtil } from '../Util/MathUtil';
import { HierarchicalState } from '../Behaviour/State';

export class FirstPersonController extends BaseCameraController {
    constructor(document, renderer) {
        super(document, renderer);
        this.controls = new PointerLockControls(this.camera, renderer.domElement);

        // Collision data
        this.colliders = [];
        this.colliderRadius = 1;

        // Set initial values for camera
        this.camera.position.y = 3;
        this.camera.position.z = 0;
        this.camera.lookAt(1, 3, 0);

        // Add a click listener to lock the pointer
        this.document.body.addEventListener('click', () => {
            this.controls.lock();
        });

        this.move = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        this.state = new IdleState(this);
        this.state.setSubstate(new WalkState());
        this.state.enterState(this);
        this.run = false;
        this.maxStamina = 1000;
        this.lowStamina = 250;
        this.stamina = this.maxStamina;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.walkSpeed = 5.0;
        this.runSpeed = 10.0;
        this.slowSpeed = 2.0;
        this.speed = this.walkSpeed; // Movement speed

        this.hasKey = false;

        // Flashlight
        this.spotLight = new THREE.SpotLight(0xffffff, 3, 1000, Math.PI / 4, 1);

        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;
        this.spotLight.shadow.camera.near = 0.1;
        this.spotLight.shadow.camera.far = 1000;
        this.spotLight.decay = 1;

        this.spotLight.position.set(0, 0, 0); // relative to camera

        // Add spotlight to camera so it moves with player
        this.camera.add(this.spotLight);

        // Add target and update its position every frame to match the camera direction
        this.spotLightTarget = new THREE.Object3D();
        this.camera.add(this.spotLightTarget);
        this.spotLight.target = this.spotLightTarget;

        // Game over (for monster to stop)
        this.gameOver = false;

        // For audio
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.dungeonAmbience = new THREE.Audio(this.listener);
        this.playerWalkSound = new THREE.Audio(this.listener);
        this.playerRunSound = new THREE.Audio(this.listener);
        this.playerBreathingSound = new THREE.Audio(this.listener);
        this.getKeySound = new THREE.Audio(this.listener);
        this.doorLockedSound = new THREE.Audio(this.listener);
        this.openingDoorSound = new THREE.Audio(this.listener);
        this.deathSound = new THREE.Audio(this.listener);
        const audioLoader = new THREE.AudioLoader();

        audioLoader.load('./js/audio/dark-dungeon-ambience.wav', (buffer) => {
            this.dungeonAmbience.setBuffer(buffer);
            this.dungeonAmbience.setLoop(true);
            this.dungeonAmbience.setVolume(0.5);
            this.dungeonAmbience.play();
        });

        audioLoader.load('./js/audio/player-walk.mp3', (buffer) => {
            this.playerWalkSound.setBuffer(buffer);
            this.playerWalkSound.setLoop(true);
            this.playerWalkSound.setVolume(1);
            this.playerWalkSound.stop();
        });

        audioLoader.load('./js/audio/player-run.mp3', (buffer) => {
            this.playerRunSound.setBuffer(buffer);
            this.playerRunSound.setLoop(true);
            this.playerRunSound.setVolume(1);
            this.playerRunSound.stop();
        });

        audioLoader.load('./js/audio/player-heavy-breathing.mp3', (buffer) => {
            this.playerBreathingSound.setBuffer(buffer);
            this.playerBreathingSound.setLoop(false);
            this.playerBreathingSound.setVolume(1);
            this.playerBreathingSound.stop();
        });

        audioLoader.load('./js/audio/key-get.mp3', (buffer) => {
            this.getKeySound.setBuffer(buffer);
            this.getKeySound.setLoop(false);
            this.getKeySound.setVolume(1);
            this.getKeySound.stop();
        });

        audioLoader.load('./js/audio/door-locked.mp3', (buffer) => {
            this.doorLockedSound.setBuffer(buffer);
            this.doorLockedSound.setLoop(false);
            this.doorLockedSound.setVolume(1);
            this.doorLockedSound.stop();
        });

        audioLoader.load('./js/audio/opening-door.mp3', (buffer) => {
            this.openingDoorSound.setBuffer(buffer);
            this.openingDoorSound.setLoop(false);
            this.openingDoorSound.setVolume(1);
            this.openingDoorSound.stop();
        });

        audioLoader.load('./js/audio/death-sound.mp3', (buffer) => {
            this.deathSound.setBuffer(buffer);
            this.deathSound.setLoop(false);
            this.deathSound.setVolume(1);
            this.deathSound.stop();
        });

        document.addEventListener('pointerdown', () => {
            THREE.AudioContext.getContext().resume();
        });

        this.document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyS': this.move.backward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyD': this.move.right = true; break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.run = true;
                    break;
            }
        });

        this.document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.move.forward = false; break;
                case 'KeyS': this.move.backward = false; break;
                case 'KeyA': this.move.left = false; break;
                case 'KeyD': this.move.right = false; break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.run = false;
                    break;
            }
        });

    }

    showEndScreen(message, buttonText, isDeath = false) {
        const overlay = document.getElementById('overlay');
        const endMessage = document.getElementById('end-message');
        const restartButton = document.getElementById('restart-button');
        overlay.style.display = 'flex';
        endMessage.textContent = message;
        restartButton.textContent = buttonText;

        // Set background color based on whether it's a death or win screen
        overlay.style.backgroundColor = isDeath ? 'rgba(120, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.9)';

        // Exit pointer lock
        document.exitPointerLock?.();
    }

    setColliders(colliders) {
        this.colliders = colliders;
    }

    checkCollisions() {
        for (let collider of this.colliders) {
            if (MathUtil.checkPlayerCollision(this.camera.position, this.colliderRadius, collider)) {
                const overlapVector = MathUtil.getCollisionOverlap(this.camera.position, this.colliderRadius, collider);
                this.camera.position.add(new THREE.Vector3(overlapVector.x, 0, overlapVector.y));
            }
        }
    }

    update(delta) {
        this.state.updateState(this);

        // Update flashlight position and direction
        this.spotLight.position.copy(this.camera.position);

        // Get direction the camera is facing
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);

        // Move the target a bit ahead in that direction
        this.spotLightTarget.position.copy(this.camera.position).add(dir.multiplyScalar(10));

        this.velocity.set(0, 0, 0);

        this.direction.z = Number(this.move.forward) - Number(this.move.backward);
        this.direction.x = Number(this.move.right) - Number(this.move.left);
        this.direction.normalize(); // Ensures consistent speed

        if (this.controls.isLocked) {
            if (this.direction.length() > 0) {
                this.velocity.copy(this.direction).multiplyScalar(this.speed * delta);
                this.controls.moveRight(this.velocity.x);
                this.controls.moveForward(this.velocity.z);
            }

            this.checkCollisions();
        }
    }

}


// Walk state
export class WalkState extends HierarchicalState {

    enterState(playerController) {
        let playerIsMoving = playerController.move.forward || playerController.move.backward || playerController.move.left || playerController.move.right;
        playerController.speed = playerController.walkSpeed;
        if (!playerController.playerWalkSound?.isPlaying && playerIsMoving && !this.gameOver) {
            playerController.playerWalkSound?.play();
        }

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        let playerIsMoving = playerController.move.forward || playerController.move.backward || playerController.move.left || playerController.move.right;
        if (!playerController.playerWalkSound?.isPlaying && playerIsMoving && !this.gameOver) {
            playerController.playerWalkSound?.play();
        }
        if (playerController.run) {
            // Switch state to run state
            playerController.playerWalkSound?.stop();
            this.switchState(playerController, new RunState());
        }
        playerController.stamina = MathUtil.clamp(playerController.stamina + 1, 0, playerController.maxStamina);
        super.updateState(playerController);
    }
}

// Run state
export class RunState extends HierarchicalState {

    enterState(playerController) {
        let playerIsMoving = playerController.move.forward || playerController.move.backward || playerController.move.left || playerController.move.right;
        playerController.speed = playerController.runSpeed;

        if (!playerController.playerRunSound?.isPlaying && playerIsMoving && !this.gameOver) {
            playerController.playerRunSound?.play();
        }

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        let playerIsMoving = playerController.move.forward || playerController.move.backward || playerController.move.left || playerController.move.right;
        if (!playerController.playerRunSound?.isPlaying && playerIsMoving && !this.gameOver) {
            playerController.playerRunSound?.play();
        }
        if (!playerController.run && playerController.stamina > 0) {
            // Switch state to walk state
            playerController.playerRunSound?.stop();
            this.switchState(playerController, new WalkState());
        }
        else if (playerController.stamina <= 0) {
            // Switch state to slow state
            playerController.playerRunSound?.stop();
            this.switchState(playerController, new SlowState());
        }
        playerController.stamina = MathUtil.clamp(playerController.stamina - 1, 0, playerController.maxStamina);
        super.updateState(playerController);
    }
}

// Idle state
export class IdleState extends HierarchicalState {

    enterState(playerController) {

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        if (playerController.move.forward || playerController.move.backward || playerController.move.left || playerController.move.right) {
            // Switch state to rest state
            this.switchState(playerController, new MovingState());
        }
        playerController.stamina = MathUtil.clamp(playerController.stamina + 2, 0, playerController.maxStamina);
        super.updateState(playerController);
    }

}

// Moving state
export class MovingState extends HierarchicalState {

    enterState(playerController) {

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        if (!playerController.move.forward && !playerController.move.backward && !playerController.move.left && !playerController.move.right) {
            // Switch state to rest state
            playerController.playerWalkSound?.stop();
            playerController.playerRunSound?.stop();
            this.switchState(playerController, new IdleState());
        }
        super.updateState(playerController);
    }

}

// Slow state
export class SlowState extends HierarchicalState {

    enterState(playerController) {
        playerController.speed = playerController.slowSpeed;
        playerController.playerWalkSound?.play();
        if (!playerController.playerBreathingSound?.isPlaying) playerController.playerBreathingSound?.play();

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        if (playerController.stamina >= playerController.lowStamina) {
            if (playerController.run) {
                // Switch state to run state
                playerController.playerWalkSound?.stop();
                this.switchState(playerController, new RunState());
            } else {
                // Switch state to walk state
                playerController.playerWalkSound?.stop();
                this.switchState(playerController, new WalkState());
            }
        }
        playerController.stamina = MathUtil.clamp(playerController.stamina + 1, 0, playerController.maxStamina);
        super.updateState(playerController);
    }

}