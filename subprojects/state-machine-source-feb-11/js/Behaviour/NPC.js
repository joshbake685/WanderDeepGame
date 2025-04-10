import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { Character } from './Character.js';

/**
 * 
 * The NPC class stores information and
 * behaviour only for non-player characters 
 * 
 */
export class NPC extends Character {

  constructor(color) {
  
    super(color);
    this.wanderAngle = Math.random() * (Math.PI*2);
  
  }


  // Apply brakes steering behaviour
  applyBrakes() {

    // Desired can be a 0 vector, since we desire to stop
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


  // Wander steering behaviour
  wander() {

    let distance = 10;
    let radius = 10;
    let angleOffset = 0.3;

    let futureLocation = this.velocity.clone();
    futureLocation.setLength(distance);
    futureLocation.add(this.location);
    
    let target = new THREE.Vector3(radius*Math.sin(this.wanderAngle), 0, radius*Math.cos(this.wanderAngle));
    target.add(futureLocation);
  
    let steer = this.seek(target);

    let change = Math.random() * (angleOffset*2) - angleOffset;
    this.wanderAngle = this.wanderAngle + change;
    
    return steer;

  }
  

}