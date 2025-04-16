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
  enterState(playerController) {
    if (this.substate) {
      this.substate.enterState(playerController);
    }
  }

  // update all substates
  updateState(playerController) {
    if (this.substate) {
      this.substate.updateState(playerController);
    }
  }

  // Method to set our substates
  setSubstate(newState) {
    this.substate = newState;
    this.substate.superstate = this;
  }

  // Method to switch states
  switchState(playerController, newState) {
    if (this.superstate) {
      // If there is a superstate,
      // we are swtiching the substate of the superstate
      this.superstate.setSubstate(newState);
      this.superstate.substate.enterState(playerController);
    } else {
      // We are switching a top-level state
      // Since there is no superstate
      if (this.substate) {
        // Preserve the substates
        // For the jumping example
        newState.setSubstate(this.substate);
      }
      playerController.state = newState;
      playerController.state.enterState(playerController);
    }


  }


}












