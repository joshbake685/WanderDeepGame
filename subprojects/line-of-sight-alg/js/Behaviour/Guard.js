import { NPC } from './NPC.js';
import { PatrolState } from './State.js';

export class Guard extends NPC {

  constructor(colour, enemy) {
    super(colour);

    this.state = new PatrolState();
    this.state.enterState(this, enemy);
  
  }

  switchState(state, enemy) {
    this.state = state;
    this.state.enterState(this, enemy);
  }

  update(deltaTime, bounds, enemy) {
    super.update(deltaTime, bounds);
    this.state.updateState(this, enemy);
  }



}