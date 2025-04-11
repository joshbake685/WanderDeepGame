import * as THREE from 'three';

export class State {
 
  // Creating an abstract class in JS
  // Ensuring enterState and updateState are implemented
  constructor() {
 
    if (this.constructor === State) {
      throw new Error("Class is of abstract type and cannot be instantiated");
    }

    if (this.enterState === undefined) {
      throw new Error("enterState method must be implemented");
    }

    if (this.updateState === undefined) {
      throw new Error("updateState method must be implemented");
    }
 
  }

}

// Hierarchical State class
export class HierarchicalState extends State {

  // initialize our substates
  constructor() {
    super();
    this.substate = null;
    this.superstate = null;
  }

  // enter all substates
  enterState(player) {
    if (this.substate) {
      this.substate.enterState(player);
    }
  }

  // update all substates
  updateState(player, controller) {
    if (this.substate) {
      this.substate.updateState(player, controller);
    }
  }

  // Method to set our substates
  setSubstate(newState) {
    this.substate = newState;
    this.substate.superstate = this;
  }

  // Method to switch states
  switchState(player, newState) {
    if (this.superstate) {
      // If there is a superstate,
      // we are swtiching the substate of the superstate
      this.superstate.setSubstate(newState);
      this.superstate.substate.enterState(player);
    } else {
      // We are switching a top-level state
      // Since there is no superstate
      if (this.substate) {
        // Preserve the substates
        // For the jumping example
        newState.setSubstate(this.substate);
      }
      player.state = newState;
      player.state.enterState(player);
    }


  }


}












