import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { MathUtil } from '../Util/MathUtil.js';
import { JPS } from '../World/JPS.js';
import { Path } from '../World/Path.js';

export class Monster {

    constructor(gameMap) {
        this.gameMap = gameMap;
        this.size = 5;

        // Creating a cone game object for our Character
        let coneGeo = new THREE.ConeGeometry(this.size / 2, this.size, 10);
        let coneMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        let mesh = new THREE.Mesh(coneGeo, coneMat);
        mesh.rotation.x = Math.PI / 2;

        this.gameObject = new THREE.Group();
        this.gameObject.add(mesh);

        this.location = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.topSpeed = 12;

        this.mass = 0.1;
        this.maxForce = 25;

        this.pathPoint = 0;
        this.wanderPath = new Path(3);
        this.jps = new JPS(this.gameMap.mapGraph);
    }

    // Set the colour of our character
    setColor(color) {
        this.gameObject.children[0].material = new THREE.MeshStandardMaterial({ color: color });
    }

    // To update our character
    update(deltaTime, gameMap) {

        // Follow wander path found by JPS
        let currentNode = this.gameMap.quantize(this.location);
        if (this.wanderPath.length() === 0 || currentNode === this.gameMap.quantize(this.wanderPath.get(this.wanderPath.length() - 1))) {
            console.log("Node reached. Changing course!");
            let newTargetNodeIndex = MathUtil.getRandomInt(0, this.gameMap.mapGraph.nodes.length - 1);
            let newTargetNode = this.gameMap.mapGraph.nodes[newTargetNodeIndex];
            let points = this.jps.find(currentNode, newTargetNode);
            this.pathPoint = 0;
            this.wanderPath.points = [];
            points.forEach(point => {
                this.wanderPath.points.push(this.gameMap.localize(point));
            });
        }
        this.applyForce(this.simpleFollow(this.wanderPath));

        // Update acceleration via velocity
        this.velocity.addScaledVector(this.acceleration, deltaTime);
        if (this.velocity.length() > this.topSpeed) {
            this.velocity.setLength(this.topSpeed);
        }

        // Point in the direction of movement
        if (this.velocity.length() > 0.1) {
            let angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.gameObject.rotation.y = angle;
        }

        // Update velocity via location
        this.location.addScaledVector(this.velocity, deltaTime);

        //this.checkBounds(bounds);
        this.checkEdges(gameMap);

        this.gameObject.position.copy(this.location);
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