import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';

/**
 *
 * The Character class contains information
 * and behaviour related to both players and NPCs 
 * 
 */
export class Character {

  constructor(color) {

    this.size = 5;

    // Creating a cone game object for our Character
    let coneGeo = new THREE.ConeGeometry(this.size/2, this.size, 10);
    let coneMat = new THREE.MeshStandardMaterial({color: color});
    let mesh = new THREE.Mesh(coneGeo, coneMat);
    mesh.rotation.x = Math.PI/2;
       
    this.gameObject = new THREE.Group();
    this.gameObject.add(mesh);

    this.location = new THREE.Vector3(0,0,0);
    this.velocity = new THREE.Vector3(0,0,0);
    this.acceleration = new THREE.Vector3(0,0,0);
    this.topSpeed = 12;

    this.mass = 1;
    this.maxForce = 25;

  }

  // Set the colour of our character
  setColor(color) {
    this.gameObject.children[0].material = new THREE.MeshStandardMaterial({color:color});
    
  }
  
  // To update our character
  update(deltaTime, gameMap) {

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
      let nodeEdge = nodeLocation.x - gameMap.tileSize/2;
      let characterEdge = this.location.x - this.size/2;
      if (characterEdge < nodeEdge) {
        this.location.x += (nodeEdge - characterEdge) * smoothFactor;
      }
    }

    // Check the east edge or right edge
    if (!node.hasEdgeTo(node.i + 1, node.j)) {
      let nodeEdge = nodeLocation.x + gameMap.tileSize/2;
      let characterEdge = this.location.x + this.size/2;
      if (characterEdge > nodeEdge) {
        this.location.x += (nodeEdge - characterEdge) * smoothFactor;
      }
    }

    // Check top edge
    if (!node.hasEdgeTo(node.i, node.j - 1)) {
      let nodeEdge = nodeLocation.z - gameMap.tileSize/2;
      let characterEdge = this.location.z - this.size/2;
      if (characterEdge < nodeEdge) {
        this.location.z += (nodeEdge - characterEdge) * smoothFactor;
      }
    }

    // Check bottom edge
    if (!node.hasEdgeTo(node.i, node.j + 1)) {
      let nodeEdge = nodeLocation.z + gameMap.tileSize/2;
      let characterEdge = this.location.z + this.size/2;
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
  

}