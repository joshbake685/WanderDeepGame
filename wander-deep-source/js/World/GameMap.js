import * as THREE from 'three';
import { MapGraph } from './MapGraph.js';
import { MapNode } from './MapNode.js';
import { MapRenderer } from './MapRenderer.js';
import { DungeonGenerator } from './DungeonGenerator.js';

export class GameMap {

  // Constructor for our GameMap class
  constructor(groundMaterial, wallMaterial) {
    this.groundMaterial = groundMaterial;
    this.wallMaterial = wallMaterial;

    // Initialize bounds in here!
    // this.bounds = new THREE.Box3(
    //   new THREE.Vector3(-200, 0, -200), // scene min
    //   new THREE.Vector3(200, 0, 200) // scene max
    // );
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-100, 0, -100), // scene min
      new THREE.Vector3(100, 0, 100) // scene max
    );

    // worldSize is a Vector3 with 
    // the dimensions of our bounds
    this.worldSize = new THREE.Vector3();
    this.bounds.getSize(this.worldSize);

    // Let's define a tile size
    // for our tile-based map
    //this.tileSize = 4;
    this.tileSize = 5;
    // Columns and rows of our tile world
    let cols = this.worldSize.x / this.tileSize;
    let rows = this.worldSize.z / this.tileSize;


    // Create our graph!
    this.mapGraph = new MapGraph(cols, rows);


    // Put our dungeon generator here!
    this.dungeonGenerator = new DungeonGenerator(this.mapGraph, 6, this);
    this.dungeonGenerator.generate();


    // Create our map renderer
    this.mapRenderer = new MapRenderer(this, this.groundMaterial, this.wallMaterial);

    // Create our game object (returns a promise)
    this.gameObject = this.mapRenderer.createRendering();
  }


  // Method to get from node to world location
  localize(node) {
    let x = this.bounds.min.x + (node.i * this.tileSize) + this.tileSize / 2;
    let y = this.tileSize;
    let z = this.bounds.min.z + (node.j * this.tileSize) + this.tileSize / 2;
    return new THREE.Vector3(x, y, z);
  }

  // Method to get from world location to node
  quantize(location) {
    let nodeI = Math.floor((location.x - this.bounds.min.x) / this.tileSize);
    let nodeJ = Math.floor((location.z - this.bounds.min.z) / this.tileSize);

    return this.mapGraph.getAt(nodeI, nodeJ);
  }



}