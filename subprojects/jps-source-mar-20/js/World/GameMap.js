import * as THREE from 'three';
import { MapGraph } from './MapGraph.js';
import { MapRenderer } from './MapRenderer.js';
import { JPS } from './JPS.js';

export class GameMap {

  // Constructor for our GameMap class
  constructor() {
  
    // Initialize bounds in here!
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-100,0,-100), // scene min
      new THREE.Vector3(100,0,100) // scene max
    );

    // worldSize is a Vector3 with 
    // the dimensions of our bounds
    this.worldSize = new THREE.Vector3();
    this.bounds.getSize(this.worldSize);

    // Let's define a tile size
    // for our tile-based map
    this.tileSize = 20;

    // Columns and rows of our tile world
    let cols = this.worldSize.x/this.tileSize;
    let rows = this.worldSize.z/this.tileSize;

    // Create our graph!
    this.mapGraph = new MapGraph(cols, rows);

    // Create our map renderer
    this.mapRenderer = new MapRenderer(this);

    // Create our game object
    this.gameObject = this.mapRenderer.createRendering();


    // Create jps
    // Only passing in the game map so we can highlight tiles
    // Otherwise, omit
    this.jps = new JPS(this.mapGraph);


  }

  // Method to path find
  // Put in whichever pathfinding approach you'd like
  pathFind(start, end) {
    
    // aStar returns a map based on nodes    
    let nodePath = this.jps.find(start, end);

    for (let p of nodePath) {
      this.highlight(p, 'yellow');
    }
    
    this.highlight(start, 'red');
    this.highlight(end, 'green');
    
    return [];
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

  // highlight method
  // this is just for debugging
  highlight(node, color) {
    let highlightedObject = this.mapRenderer.highlight(node, color);
    this.gameObject.add(highlightedObject);
  }

}