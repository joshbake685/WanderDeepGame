import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { MathUtil } from '../Util/MathUtil.js';
import { JPS } from '../World/JPS.js';
import { Path } from '../World/Path.js';
import { State } from './State.js';
import { MapNode } from '../World/MapNode.js';

export class Monster {

    constructor(gameMap, playerController, scene, monsterModel) {
        this.gameMap = gameMap;
        this.playerController = playerController;
        this.scene = scene;
        this.model = monsterModel;
        this.size = 3;

        // Create a mixer for GLB model
        this.mixer = null;
        this.model.scale.set(5, 5, 5);

        // Set up and play the animation
        this.mixer = new THREE.AnimationMixer(this.model);
        this.mixer.clipAction(this.model.animations[0]).play();

        this.scene.add(this.model);

        this.location = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.wanderTopSpeed = 4;
        this.pursueTopSpeed = 5;
        this.seekTopSpeed = 6;
        this.topSpeed = this.wanderTopSpeed;
        this.stopped = false;

        this.mass = 0.1;
        this.maxForce = 25;

        this.pathPoint = 0;
        this.wanderPath = new Path(3);
        this.jps = new JPS(this.gameMap.mapGraph);
        this.pursueRange = 35;
        this.maxPursueTimer = 5;
        this.pursueTimer = this.maxPursueTimer;
        this.fov = 5 * Math.PI / 12;

        // Monster audio setup
        this.walkSound = new THREE.PositionalAudio(this.playerController.listener);
        this.growlCloseSound = new THREE.PositionalAudio(this.playerController.listener);
        this.growlDistantSound = new THREE.PositionalAudio(this.playerController.listener);
        this.roarSound = new THREE.PositionalAudio(this.playerController.listener);

        const audioLoader = new THREE.AudioLoader();

        audioLoader.load('../../audio/monster-walk.mp3', (buffer) => {
            this.walkSound.setBuffer(buffer);
            this.walkSound.setRefDistance(1);
            this.walkSound.setLoop(true);
            this.walkSound.setVolume(1.5);
            this.walkSound.setDistanceModel('inverse');
            this.walkSound.setRolloffFactor(1);
            this.walkSound.setPlaybackRate(0.6);
            this.walkSound.setMaxDistance(this.pursueRange);
            this.model.add(this.walkSound);
            this.walkSound.play();
        });

        audioLoader.load('../../audio/monster-growl-close.mp3', (buffer) => {
            this.growlCloseSound.setBuffer(buffer);
            this.growlCloseSound.setRefDistance(this.pursueRange / 2);
            this.growlCloseSound.setLoop(false);
            this.growlCloseSound.setVolume(1.5);
            this.growlCloseSound.setDistanceModel('inverse');
            this.growlCloseSound.setRolloffFactor(1);
            this.growlCloseSound.setMaxDistance(this.pursueRange);
            this.model.add(this.growlCloseSound);
            this.growlCloseSound.stop();
        });

        audioLoader.load('../../audio/monster-growl-distant.mp3', (buffer) => {
            this.growlDistantSound.setBuffer(buffer);
            this.growlDistantSound.setRefDistance(this.pursueRange / 2);
            this.growlDistantSound.setLoop(false);
            this.growlDistantSound.setVolume(1.5);
            this.growlDistantSound.setDistanceModel('inverse');
            this.growlDistantSound.setRolloffFactor(1);
            this.growlDistantSound.setMaxDistance(this.pursueRange);
            this.model.add(this.growlDistantSound);
            this.growlDistantSound.stop();
        });

        audioLoader.load('../../audio/monster-roar.mp3', (buffer) => {
            this.roarSound.setBuffer(buffer);
            this.roarSound.setRefDistance(this.pursueRange / 2);
            this.roarSound.setLoop(false);
            this.roarSound.setVolume(1.5);
            this.roarSound.setDistanceModel('inverse');
            this.roarSound.setRolloffFactor(1);
            this.roarSound.setMaxDistance(this.pursueRange);
            this.model.add(this.roarSound);
            this.roarSound.stop();
        });

        this.playedDeathSound = false;

        this.state = new WanderState();
        this.state.enterState(this, this.playerController);
    }

    // Switch monster's state
    switchState(state, player) {
        this.state = state;
        this.state.enterState(this, player);
    }

    // To update our character
    update(deltaTime, gameMap) {

        let playerNode = this.gameMap.quantize(this.playerController.camera.position);
        let monsterNode = this.gameMap.quantize(this.location);
        if (playerNode.i === monsterNode.i && playerNode.j === monsterNode.j) {
            this.playerController.gameOver = true;
            if (!this.playedDeathSound) {
                this.playedDeathSound = true;
                this.walkSound?.stop();
                this.playerController.deathSound?.play();
            }
            this.playerController.controls.unlock();
            this.playerController.showEndScreen("YOU DIED", "Try again", true);
        }

        // Stop moving + animating when game is over
        if (this.playerController.gameOver && !this.stopped) {
            this.stopped = true;
            this.topSpeed = 0;
            this.walkSound?.stop();
            this.mixer.clipAction(this.model.animations[0]).fadeOut(3);
        }

        this.state.updateState(deltaTime, this, this.playerController);
        this.mixer.update(deltaTime);

        // Update acceleration via velocity
        this.velocity.addScaledVector(this.acceleration, deltaTime);
        if (this.velocity.length() > this.topSpeed) {
            this.velocity.setLength(this.topSpeed);
        }

        // Point in the direction of movement
        if (this.velocity.length() > 0.1) {
            let angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.model.rotation.y = angle;
        }

        // Update velocity via location
        this.location.addScaledVector(this.velocity, deltaTime);

        this.checkEdges(gameMap);

        this.model.position.copy(this.location);
        this.model.position.setY(0);
        this.acceleration.setLength(0);

    }

    // Wrap around the scene
    checkBounds(bounds) {
        this.location.x = THREE.MathUtils.euclideanModulo(
            this.location.x - bounds.min.x,
            bounds.max.x - bounds.min.x
        ) + bounds.min.x;

        this.location.z = THREE.MathUtils.euclideanModulo(
            this.location.z - bounds.min.z,
            bounds.max.z - bounds.min.z
        ) + bounds.min.z;

    }

    // Check the edges to ensure our character 
    // is within a traversable node
    checkEdges(gameMap) {
        let node = gameMap.quantize(this.location);
        let nodeLocation = gameMap.localize(node);

        let smoothFactor = 0.2;

        // Checking the west edge or left edge
        if (!node.hasEdgeTo(node.i - 1, node.j)) {
            let nodeEdge = nodeLocation.x - gameMap.tileSize / 2;
            let characterEdge = this.location.x - this.size / 2;
            if (characterEdge < nodeEdge) {
                this.location.x += (nodeEdge - characterEdge) * smoothFactor;
            }
        }

        // Check the east edge or right edge
        if (!node.hasEdgeTo(node.i + 1, node.j)) {
            let nodeEdge = nodeLocation.x + gameMap.tileSize / 2;
            let characterEdge = this.location.x + this.size / 2;
            if (characterEdge > nodeEdge) {
                this.location.x += (nodeEdge - characterEdge) * smoothFactor;
            }
        }

        // Check top edge
        if (!node.hasEdgeTo(node.i, node.j - 1)) {
            let nodeEdge = nodeLocation.z - gameMap.tileSize / 2;
            let characterEdge = this.location.z - this.size / 2;
            if (characterEdge < nodeEdge) {
                this.location.z += (nodeEdge - characterEdge) * smoothFactor;
            }
        }

        // Check bottom edge
        if (!node.hasEdgeTo(node.i, node.j + 1)) {
            let nodeEdge = nodeLocation.z + gameMap.tileSize / 2;
            let characterEdge = this.location.z + this.size / 2;
            if (characterEdge > nodeEdge) {
                this.location.z += (nodeEdge - characterEdge) * smoothFactor;
            }
        }
    }

    // Returns true if player is in monster's line of sight
    lineOfSight() {
        const toPlayer = this.playerController.camera.position.clone().sub(this.location).normalize();

        // Monster's facing direction
        this.forward = new THREE.Vector3(0, 0, 1);
        this.forward.applyEuler(new THREE.Euler(0, this.model.rotation.y, 0));

        const angle = toPlayer.angleTo(this.forward);

        if (angle < this.fov) {
            const distance = this.location.distanceTo(this.playerController.camera.position);
            const steps = Math.floor(distance);

            for (let i = 0; i < steps; i++) {
                const stepPoint = this.location.clone().add(toPlayer.clone().multiplyScalar(i));
                const node = this.gameMap.quantize(stepPoint);
                if (node.type === MapNode.Type.Obstacle) {
                    return false;
                }
            }

            return true; // No obstacles and within FOV
        }

        return false;
    }


    // Apply force to our character
    applyForce(force) {
        force.divideScalar(this.mass);
        this.acceleration.add(force);
    }

    // Stop our character
    stop() {
        this.velocity.set(0, 0, 0);
    }

    // Apply brakes method to slow down to a stop
    applyBrakes() {

        let desired = new THREE.Vector3();
        let steer = VectorUtil.sub(desired, this.velocity);

        if (steer.length() > this.maxForce) {
            steer.setLength(this.maxForce);
        }
        return steer;

    }

    // Seek steering behaviour
    seek(target) {

        // Calculate desired velocity
        let desired = VectorUtil.sub(target, this.location);
        desired.setLength(this.topSpeed);

        // Calculate steering force
        let steer = VectorUtil.sub(desired, this.velocity);

        if (steer.length() > this.maxForce) {
            steer.setLength(this.maxForce);
        }

        return steer;
    }

    // Arrive steering behaviour
    arrive(target, radius) {

        let desired = new THREE.Vector3();
        desired.subVectors(target, this.location);

        let distance = desired.length();

        // If we are close enough to
        // the target, stop
        if (distance < 0.1) {
            this.stop();

            // Slow down if we are within
            // a specified radius to the target
        } else if (distance < radius) {
            let speed = (distance / radius) * this.topSpeed;
            desired.setLength(speed);

            // Otherwise, proceed as seek
        } else {
            desired.setLength(this.topSpeed);

        }

        // Apply our steering formula
        let steer = new THREE.Vector3();
        steer.subVectors(desired, this.velocity);

        if (steer.length() > this.maxForce) {
            steer.setLength(this.maxForce);
        }

        return steer;
    }

    // Simple path follow
    simpleFollow(path) {

        // Check to make sure a path exists
        if (path.length() > 0) {

            // Getting the distance from our character to the path point
            let distance = this.location.distanceTo(path.get(this.pathPoint));

            // Check to see if it's less than a certain threshold
            // in this case, we can use our path radius
            if (distance < path.radius) {

                // If we are at the end of the path, arrive
                if (this.pathPoint === path.length() - 1) {
                    return this.arrive(path.get(this.pathPoint), path.radius);

                }
                // otherwise, increment our path point
                this.pathPoint++;
            }
            // return seek to the current path point
            return this.seek(path.get(this.pathPoint));
        }
        // if no path, return a 0 vector
        return new THREE.Vector3();

    }


}


export class WanderState extends State {
    enterState(monster, player) {
        monster.topSpeed = monster.wanderTopSpeed;
        monster.pathPoint = 0;
        monster.wanderPath.points = [];
    }

    updateState(deltaTime, monster, player) {
        console.log("Wandering");
        let playerIsMoving = player.move.forward || player.move.backward || player.move.left || player.move.right;
        if (player && monster.lineOfSight()) {
            // Switch our state to pursue state
            monster.switchState(new SeekState(), player);
        } else if (player && monster.location.distanceTo(player.camera.position) <= monster.pursueRange && playerIsMoving && player.speed == player.runSpeed) {
            // Switch our state to pursue state
            if (!monster.growlCloseSound?.isPlaying) monster.growlCloseSound?.play();
            console.log("Close growl sound played");
            monster.switchState(new PursueState(), player);
        } else {
            // Follow wander path found by JPS
            let currentNode = monster.gameMap.quantize(monster.location);
            if (monster.wanderPath.length() === 0 || currentNode === monster.gameMap.quantize(monster.wanderPath.get(monster.wanderPath.length() - 1))) {
                // console.log("Node reached. Changing course!");
                let groundNodesFilt = monster.gameMap.mapGraph.nodes.filter((node) => { return node.type === MapNode.Type.Ground });
                let newTargetNodeIndex = MathUtil.getRandomInt(0, groundNodesFilt.length);
                let newTargetNode = groundNodesFilt[newTargetNodeIndex];
                let points = monster.jps.find(currentNode, newTargetNode);
                monster.pathPoint = 0;
                monster.wanderPath.points = [];
                points.forEach(point => {
                    monster.wanderPath.points.push(monster.gameMap.localize(point));
                });
            }
            monster.applyForce(monster.simpleFollow(monster.wanderPath));
        }
    }
}

export class PursueState extends State {
    enterState(monster, player) {
        monster.topSpeed = monster.pursueTopSpeed;
        // console.log("Pursuing");
    }

    updateState(deltaTime, monster, player) {
        console.log("Pursuing");
        if (monster.lineOfSight()) {
            // Switch our state to seek (chase) state
            monster.pursueTimer = monster.maxPursueTimer;
            monster.switchState(new SeekState(), player);
        } else if (monster.pursueTimer <= 0 && monster.location.distanceTo(player.camera.position) > monster.pursueRange) {
            // Switch our state to wander state
            monster.pursueTimer = monster.maxPursueTimer;
            setTimeout(() => {
                if (!monster.growlDistantSound?.isPlaying) monster.growlDistantSound?.play();
              }, 2000);
            console.log("Distant growl sound played");
            monster.switchState(new WanderState(), player);
        } else {
            // Decrement timer
            monster.pursueTimer -= deltaTime;

            // Follow pursue path found by JPS
            let currentNode = monster.gameMap.quantize(monster.location);
            let points = monster.jps.find(currentNode, monster.gameMap.quantize(player.camera.position));
            //console.log(player.camera.position);
            if (points.length > 1) {
                let nextPoint = monster.gameMap.localize(points[1]);
                monster.applyForce(monster.seek(nextPoint));
            }
        }
    }
}

export class SeekState extends State {
    enterState(monster, player) {
        monster.topSpeed = monster.seekTopSpeed;
        if (!monster.roarSound?.isPlaying) monster.roarSound?.play();
        console.log("Roar sound played");
    }

    updateState(deltaTime, monster, player) {
        console.log("Seeking");
        if (!monster.lineOfSight()) {
            // Switch our state to pursue state
            monster.switchState(new PursueState(), player);
        } else {
            const seekTo = new THREE.Vector3(player.camera.position.x, monster.location.y, player.camera.position.z);
            monster.applyForce(monster.seek(seekTo));
        }
    }
}