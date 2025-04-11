import * as THREE from 'three';
import { Character } from './Character.js';
import { HierarchicalState, State } from './State';


export class Player extends Character {

  constructor(color) {
    super(color);

    this.maxForce = 50;
  
    this.state = new GroundedState();
    this.state.setSubstate(new IdleState());
    this.state.enterState(this);
  }

  update(deltaTime, bounds, controller) {
    this.state.updateState(this, controller);
    super.update(deltaTime, bounds);
  }
  
}


// Idle state for when our
// player character is not moving
export class IdleState extends HierarchicalState {

  enterState(player) {
    console.log("Idle");
    // If you want to abruptly
    // stop, use this!
    // player.stop();
    super.enterState(player);
  }

  updateState(player, controller) {
    if (controller.moving()) {
      this.switchState(player, new MovingState());
    } else {
      // If you want to slow 
      // down to a stop, use this
      player.applyForce(player.applyBrakes());
      super.updateState(player, controller);
    }
  }

}

// Moving state for when our
// player character is in motion
export class MovingState extends HierarchicalState {
  
  enterState(player) {
    console.log("Moving");
    super.enterState(player);
  }

  updateState(player, controller) {
    if (!controller.moving()) {
      this.switchState(player, new IdleState());

    } else {
      let steer = controller.direction();
      steer.setLength(player.maxForce);
      player.applyForce(steer);

      super.updateState(player, controller);
    }
  }

}

// Jumping state when our character needs to jump
export class JumpingState extends HierarchicalState {

  // Upon enter state, apply a big force upward!
  enterState(player) {
    let force = new THREE.Vector3(0, 500, 0);
    player.applyForce(force);

    console.log("Jumping");
    
    // enter substates
    super.enterState(player);
  }

  // Update state
  updateState(player, controller) {
    // if the player is on the ground,
    // switch to grounded state
    if (player.location.y <= 0) {
      this.switchState(player, new GroundedState());
    }
    // update substates
    super.updateState(player, controller);
  }

}

// Grounded state for when our character is on the ground
export class GroundedState extends HierarchicalState {

  // Enter state
  enterState(player) {
    console.log("Grounded");
    
    // enter substates
    super.enterState(player);
  }

  // Update state
  updateState(player, controller) {
    // If our controller says we are jumping
    // switch to our jumping state
    if (controller.jumping()) {
      this.switchState(player, new JumpingState());
    }
    // update substates
    super.updateState(player, controller);
  }

}




























