import * as THREE from 'three';
import { MapGraph } from './MapGraph.js';
import { MapRenderer } from './MapRenderer.js';
import { Path } from './Path.js';


export class GameMap {

  // Constructor for our GameMap class
  constructor() {
  
    // Initialize bounds in here!
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-100,0,-80), // scene min
      new THREE.Vector3(100,0,80) // scene max
    );

    // worldSize is a Vector3 with 
    // the dimensions of our bounds
    this.worldSize = new THREE.Vector3();
    this.bounds.getSize(this.worldSize);

    // Let's define a tile size
    // for our tile-based map
    this.tileSize = 10;

    // Columns and rows of our tile world
    let cols = this.worldSize.x/this.tileSize;
    let rows = this.worldSize.z/this.tileSize;

    // Create our graph!
    this.mapGraph = new MapGraph(cols, rows);

    // Create our map renderer
    this.mapRenderer = new MapRenderer(this);

    // Create our game object
    this.gameObject = this.mapRenderer.createRendering();

  }

  // Method to path find
  // Put in whichever pathfinding approach you'd like
  pathFind(start, end) {
    
    // aStar returns a map based on nodes    
    let nodePath = this.mapGraph.aStar(start, end, this.mapGraph.manhattanDistance);

    // Create a path that our character can understand
    let path = new Path(this.tileSize/2);

    // For each point in our nodePath, add a localized version to our path
    for (let p of nodePath) {
      let highlightedObject = this.mapRenderer.highlight(p, 'yellow');
      this.gameObject.add(highlightedObject);

      path.points.push(this.localize(p));
    }
    
    // Return path (ensure this is not nodePath!)
    return path;
  }



  // Method to get from node to world location
  localize(node) {
    let x = this.bounds.min.x + (node.i * this.tileSize) + this.tileSize/2;
    let y = this.tileSize;
    let z = this.bounds.min.z + (node.j * this.tileSize) + this.tileSize/2;
    return new THREE.Vector3(x, y, z);
  }

  // Method to get from world location to node
  quantize(location) {
    let nodeI = Math.floor((location.x - this.bounds.min.x)/this.tileSize);
    let nodeJ = Math.floor((location.z - this.bounds.min.z)/this.tileSize);

    return this.mapGraph.getAt(nodeI, nodeJ);
  }



}