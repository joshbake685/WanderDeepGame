import * as THREE from 'three';

/**
 *
 * The Path class will be used for:
 * setting up a path for an NPC to follow
 * 
 **/
export class Path {

  // Path constructor
  constructor(radius) {

    // A path is a series of points
    this.points = [];
    // A radius for pathfollowing (important for Reynold's!)
    this.radius = radius;

  }

  // Get the path point from index i
  get(i) {
    return this.points[i];
  }

  // Return the length of the path
  length() {
    return this.points.length;
  }
  


}