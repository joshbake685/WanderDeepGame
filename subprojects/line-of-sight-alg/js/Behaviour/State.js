import { Guard } from './Guard.js';
import * as THREE from 'three';

export class State {
 
  // Creating an abstract class in JS
  // Ensuring enterState and updateState are implemented
  constructor() {
 
    if (this.constructor == State) {
      throw new Error("Class is of abstract type and cannot be instantiated");
    };

    if (this.enterState == undefined) {
      throw new Error("enterState method must be implemented");
    };

    if (this.updateState == undefined) {
      throw new Error("updateState method must be implemented");
    };
 
  }

}

// Patrol state which will wander the scene
export class PatrolState extends State {

  enterState(guard, enemy) {
    guard.topSpeed = 10;
    guard.setColor('blue');
    console.log("Guarding");
  }

  updateState(guard, enemy) {
    if (guard.location.distanceTo(enemy.location) <= 40) {
      // Switch our state to fight state
      guard.switchState(new FightState(), enemy);
    } else {
      guard.applyForce(guard.wander());
    }
  }
}

// Fight state
export class FightState extends State {

  enterState(guard, enemy) {
    guard.topSpeed = 30;
    guard.setColor('yellow');
    console.log("Fighting!");
  }

  updateState(guard, enemy) {
    if (guard.location.distanceTo(enemy.location) > 40) {
      guard.switchState(new RestState(), enemy);
    } else {
      guard.applyForce(guard.seek(enemy.location));
    }

  }

}

// Rest state
export class RestState extends State {

  enterState(guard, enemy) {
    guard.setColor('white');
    console.log("Resting...");
    setTimeout(() => {
      guard.switchState(new PatrolState(), enemy);
    }, 2000);
  }

  updateState(guard, enemy) {
    guard.applyForce(guard.applyBrakes());
  }

}














