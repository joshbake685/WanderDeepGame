import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MapNode } from './MapNode.js';

export class MapRenderer {


  // MapRenderer constructor
  constructor(gameMap, groundMaterial, wallMaterial) {
    this.gameMap = gameMap;
    this.groundMaterial = groundMaterial;
    this.wallMaterial = wallMaterial;

    this.groundColor = new THREE.Color(0xFFFFFF);
    this.obstacleColor = new THREE.Color(0x555555);

  }


  // To create the actual game object
  // associated with our GameMap
  createRendering() {
    // Use provided materials
    let groundMaterial = this.groundMaterial;
    let obstacleMaterial = this.wallMaterial;

    // Group nodes by type
    let nodes = this.gameMap.mapGraph.nodes;
    let groundNodes = nodes.filter(n => n.type === MapNode.Type.Ground);
    let obstacleNodes = nodes.filter(n => n.type === MapNode.Type.Obstacle);

    // Create shared box geometry
    let tileGeometry = new THREE.BoxGeometry(
      this.gameMap.tileSize,
      this.gameMap.tileSize,
      this.gameMap.tileSize
    );

    let half = this.gameMap.tileSize / 2;
    let minX = this.gameMap.bounds.min.x;
    let minZ = this.gameMap.bounds.min.z;

    /**
     * The ground geometries need to be merged so that lighting works on it
     * (spotlights do not work on instanced meshes for some reason)
     * The same must be done for the obstacle geometries as well
     */

    // *** Ground geometry creation and merging ***
    let groundGeometries = [];

    for (let i = 0; i < groundNodes.length; i++) {
      let node = groundNodes[i];
      let x = minX + node.i * this.gameMap.tileSize + half;
      let y = 0;
      let z = minZ + node.j * this.gameMap.tileSize + half;

      let tile = tileGeometry.clone();
      tile.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));
      groundGeometries.push(tile);
    }

    let mergedGroundGeometry = mergeGeometries(groundGeometries);
    let groundMesh = new THREE.Mesh(mergedGroundGeometry, groundMaterial);
    groundMesh.position.sub(new THREE.Vector3(0, 2.5, 0));
    groundMesh.receiveShadow = true;

    // *** Obstacle geometry creation and merging ***
    let obstacleGeometries = [];

    for (let i = 0; i < obstacleNodes.length; i++) {
      let node = obstacleNodes[i];
      let elevation = 2;

      let x = minX + node.i * this.gameMap.tileSize + half;
      let y = elevation / 2;
      let z = minZ + node.j * this.gameMap.tileSize + half;

      let tile = tileGeometry.clone();
      tile.applyMatrix4(new THREE.Matrix4()
        .makeTranslation(x, y, z)
        .multiply(new THREE.Matrix4().makeScale(1, elevation, 1))
      );

      obstacleGeometries.push(tile);
    }

    let mergedObstacleGeometry = mergeGeometries(obstacleGeometries);
    let obstacleMesh = new THREE.Mesh(mergedObstacleGeometry, obstacleMaterial);
    obstacleMesh.castShadow = true;
    obstacleMesh.receiveShadow = true;

    // Group everything
    let gameObject = new THREE.Group();
    gameObject.add(groundMesh, obstacleMesh);
    return gameObject;
  }
}

