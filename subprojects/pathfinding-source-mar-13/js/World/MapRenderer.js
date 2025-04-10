import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MapNode } from './MapNode.js'


export class MapRenderer {


  // MapRenderer constructor
  constructor(gameMap) {
    this.gameMap = gameMap;
  }


  // To create the actual game object
  // associated with our GameMap
  createRendering() {

    // Create ground material + geometry
    let groundMaterial = new THREE.MeshStandardMaterial({color: 'lightgray'});
    let groundGeometry =
      new THREE.BoxGeometry(
        this.gameMap.worldSize.x, 
        this.gameMap.tileSize, 
        this.gameMap.worldSize.z
      );
    
    // Create the ground mesh
    let ground = new THREE.Mesh(groundGeometry, groundMaterial);

    // Create obstacle material + geometries
    let obstacleMaterial = new THREE.MeshStandardMaterial({color: 'blue'});
    let obstacleGeometries = new THREE.BoxGeometry(0,0,0);

    
    // Loop over tile nodes to add them 
    // to their respective geometries
    for (let node of this.gameMap.mapGraph.nodes) {
      if (node.type === MapNode.Type.Obstacle) {
        obstacleGeometries = 
          this.addToTileGeometries(obstacleGeometries, node);
      }
    }

    // Create the obstacles mesh
    let obstacles = new THREE.Mesh(obstacleGeometries, obstacleMaterial);

    // Create our map gameObject
    let gameObject = new THREE.Group();

    // Add the ground, obstacles, path to the gameObject
    gameObject.add(ground);
    gameObject.add(obstacles);
 
    return gameObject;
  }


  // To create non-ground tile geometries
  addToTileGeometries(geometries, node) {

    // Can change this.gameMap.based on tile type
    let height = this.gameMap.tileSize;

    // Create tile geometry
    let geometry = this.createTileGeometry(node, height);

    // Add to the specified geometry
    geometries =
      BufferGeometryUtils.mergeGeometries(
        [geometries, geometry]
      );
    
    // Return the updated geometries
    return geometries;
  }


  // Create an individual tile geometry
  createTileGeometry(node, height) {
    // The coordinates of our top left edge of the tile
    let x = this.gameMap.bounds.min.x + (node.i * this.gameMap.tileSize) + this.gameMap.tileSize/2;
    let y = this.gameMap.tileSize/2;
    let z = this.gameMap.bounds.min.z + (node.j * this.gameMap.tileSize) + this.gameMap.tileSize/2;
    let position = new THREE.Vector3(x, y, z);
    
    // Set the geometry of our tile
    let geometry = 
      new THREE.BoxGeometry(
        this.gameMap.tileSize, 
        height,
        this.gameMap.tileSize
      );

    // Translate our geomtery to the required position
    geometry.translate(position);
    geometry.translate(0, height/2, 0);

    return geometry;
  }


  // Highlight a particular node/tile of a specified colour
  highlight(node, color) {
    
    let geometry = this.createTileGeometry(node, 1)
    let material = new THREE.MeshStandardMaterial({color: color});

    return new THREE.Mesh(geometry, material);

  }
}

