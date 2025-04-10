import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { Path } from '../World/Path.js';
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
    this.pathPoint = 0;

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
      let speed = (distance/radius) * this.topSpeed;
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
        if (this.pathPoint === path.length()-1) {
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