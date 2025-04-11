import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';

export class Controller {

  // Controller Constructor
  constructor(doc, camera) {
    this.doc = doc;
    this.camera = camera;

    this.left = false;
    this.right = false;
    this.forward = false;
    this.backward = false;

    this.jump = false;

    this.doc.addEventListener('keydown', this);
    this.doc.addEventListener('keyup', this);
  }

  // Handling events
  handleEvent(event) {
    if (event.type === 'keydown') {
      if (event.code === "ArrowUp") { this.forward = true; }
      else if (event.code === "ArrowDown") { this.backward = true; }
      else if (event.code === "ArrowLeft") { this.left = true; }
      else if (event.code === "ArrowRight") { this.right = true; }
      // New for jumping!
      else if (event.code === "Space") { this.jump = true; }
    }
    else if (event.type === 'keyup') {
      if (event.code === "ArrowUp") { this.forward = false; }
      else if (event.code === "ArrowDown") { this.backward = false; }
      else if (event.code === "ArrowLeft") { this.left = false; }
      else if (event.code === "ArrowRight") { this.right = false; }
      // New for jumping!
      else if (event.code === "Space") { this.jump = false; }
    }
  }

  // Get angle offset
  getInputAngle() {
    // Default angle offset is 0 for backward/down on our screen
    let angle = 0;
    
    if (this.backward) {
      if (this.left) { angle -= Math.PI/4; }
      if (this.right) { angle += Math.PI/4; }
    }

    else if (this.forward) { 
      angle = Math.PI; 
      if (this.left) { angle += Math.PI/4; }
      if (this.right) { angle -= Math.PI/4; }
    }

    // Otherwise, if left or right
    // Offset angle by Math.PI/2
    else if (this.left) { angle = -Math.PI/2; }
    else if (this.right) { angle = Math.PI/2; }

    return angle;
  }

  // Check whether our controller is indicating a movement action
  moving() {
    if (this.left || this.right || this.forward || this.backward) {
      return true;
    }
    return false;
  }

  // New for jumping!
  jumping() {
    return this.jump;
  }


  // Gets the absolute direction our character is moving
  direction() {
    
    let worldDirection = new THREE.Vector3();
    this.camera.getWorldDirection(worldDirection);
    
    let directionAngle =  Math.atan2(worldDirection.x, worldDirection.z);
    directionAngle += Math.PI;
    directionAngle += this.getInputAngle();

    let x = Math.sin(directionAngle);
    let z = Math.cos(directionAngle);

    return new THREE.Vector3(x, 0, z);
  }

}
