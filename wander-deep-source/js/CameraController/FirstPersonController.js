import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { BaseCameraController } from './BaseCameraController';
import { MathUtil } from '../Util/MathUtil';

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

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.speed = 5.0; // Movement speed

        this.document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyS': this.move.backward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyD': this.move.right = true; break;
            }
        });

        this.document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.move.forward = false; break;
                case 'KeyS': this.move.backward = false; break;
                case 'KeyA': this.move.left = false; break;
                case 'KeyD': this.move.right = false; break;
            }
        });

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