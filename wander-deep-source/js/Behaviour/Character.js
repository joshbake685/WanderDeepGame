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

    this.size = 3;

    // Creating a cone game object for our Character
    let coneGeo = new THREE.ConeGeometry(this.size/2, this.size, 10);
    let coneMat = new THREE.MeshStandardMaterial({color: color});
    let mesh = new THREE.Mesh(coneGeo, coneMat);
    mesh.castShadow = true;

    mesh.rotation.x = Math.PI/2;
    mesh.position.y = this.size/2;
       
    this.gameObject = new THREE.Group();
    this.gameObject.add(mesh);

    this.location = new THREE.Vector3(0,0,0);
    this.velocity = new THREE.Vector3(0,0,0);
    this.acceleration = new THREE.Vector3(0,0,0);
    this.topSpeed = 20;

    this.mass = 1;
    this.maxForce = 15;

  }



  // To update our character
  update(deltaTime, bounds) {

    // NEW HFSM
    this.gravity();

    // Update acceleration via velocity
    this.velocity.addScaledVector(this.acceleration, deltaTime);
    if (this.velocity.length() > this.topSpeed) {
      this.velocity.setLength(this.topSpeed);
    }
    // Update velocity via location
    this.location.addScaledVector(this.velocity, deltaTime);
    
    // Point in the direction of movement
    // we only want to rotate when the length of our x z velocity is != 0
    // Otherwise, we keep it at the most recent frame
    let velocityXZ = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    if (velocityXZ.length() > 0) {
      let angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.gameObject.rotation.y = angle;
    }

    this.checkBounds(bounds);


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


  // Apply force to our character
  applyForce(force) {
    force.divideScalar(this.mass);
    this.acceleration.add(force);
  }

  // If you just want to stop
  stop() {
    this.velocity.x = 0;
    this.velocity.z = 0;
  }

  // Apply brakes steering behaviour  
  applyBrakes() {
    let velocityXZ = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    let brake = VectorUtil.multiplyScalar(velocityXZ, -1);
    if (brake.length() > this.maxForce) {
      brake.setLength(this.maxForce);
    }
    return brake;
  }

  // Gravity
  gravity() {
    if (this.location.y <= 0) { 
      this.velocity.y = 0; 
      this.location.y = 0;
    } else {
      this.applyForce(new THREE.Vector3(0,-10,0));
    }
  }


}