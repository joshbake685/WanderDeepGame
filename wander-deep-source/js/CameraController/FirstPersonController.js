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
        this.maxStamina = 1000000;
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
        // Parameters: color, intensity, distance, angle, penumbra

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
        playerController.speed = playerController.walkSpeed;
        //console.log("Walking");

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        if (playerController.run) {
            // Switch state to run state
            this.switchState(playerController, new RunState());
        }
        playerController.stamina = MathUtil.clamp(playerController.stamina + 1, 0, playerController.maxStamina);
        super.updateState(playerController);
    }
}

// Run state
export class RunState extends HierarchicalState {

    enterState(playerController) {
        playerController.speed = playerController.runSpeed;
        //console.log("Running");

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        if (!playerController.run && playerController.stamina > 0) {
            // Switch state to walk state
            this.switchState(playerController, new WalkState());
        }
        else if (playerController.stamina <= 0) {
            // Switch state to slow state
            this.switchState(playerController, new SlowState());
        }
        playerController.stamina = MathUtil.clamp(playerController.stamina - 1, 0, playerController.maxStamina);
        super.updateState(playerController);
    }
}

// Idle state
export class IdleState extends HierarchicalState {

    enterState(playerController) {
        //console.log("At rest");

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
        //console.log("At rest");

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        if (!playerController.move.forward && !playerController.move.backward && !playerController.move.left && !playerController.move.right) {
            // Switch state to rest state
            this.switchState(playerController, new IdleState());
        }
        super.updateState(playerController);
    }

}

// Slow state
export class SlowState extends HierarchicalState {

    enterState(playerController) {
        playerController.speed = playerController.slowSpeed;
        //console.log("Slow");

        // enter substates
        super.enterState(playerController);
    }

    updateState(playerController) {
        if (playerController.stamina >= playerController.lowStamina) {
            if (playerController.run) {
                // Switch state to run state
                this.switchState(playerController, new RunState());
            } else {
                // Switch state to walk state
                this.switchState(playerController, new WalkState());
            }
        }
        playerController.stamina = MathUtil.clamp(playerController.stamina + 1, 0, playerController.maxStamina);
        super.updateState(playerController);
    }

}