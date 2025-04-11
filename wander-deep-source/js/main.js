import * as THREE from 'three';
import { GameMap } from './World/GameMap.js';
import { FirstPersonController } from './CameraController/FirstPersonController.js';
import { OrbitCameraController } from './CameraController/OrbitCameraController.js';
import { DebugBlock } from '../DebugBlock.js';

const USE_CAMERA_ORBIT = false; // For debugging
const ENABLE_ROOF = !USE_CAMERA_ORBIT;

// Create Scene
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
let cameraController = null;
let colliders = [];


// Create clock
const clock = new THREE.Clock();


// Declare our GameMap
let gameMap;



// Setup our scene
function init() {

  scene.background = new THREE.Color(0xffffff);

  // Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Directional Light
  let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 5, 5);
  scene.add(directionalLight);

  // Ambient Light
  let ambient = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambient);

  // Create our gameMap
  gameMap = new GameMap();
  scene.add(gameMap.gameObject);

  // Create roof
  if (ENABLE_ROOF) {
    const roofGeometry = new THREE.BoxGeometry(gameMap.bounds.max.x - gameMap.bounds.min.x, 1, gameMap.bounds.max.z - gameMap.bounds.min.z);
    const roofMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.position.set(0, 5.5, 0);
    scene.add(roofMesh);
  }

  // Update colliders with wall colliders
  colliders = gameMap.dungeonGenerator.colliders;

  if (!USE_CAMERA_ORBIT) {
    cameraController = new FirstPersonController(document, renderer);
    cameraController.colliders = colliders;
    cameraController.camera.position.x = gameMap.dungeonGenerator.playerSpawn.x;
    cameraController.camera.position.z = gameMap.dungeonGenerator.playerSpawn.z;
  } else {
    cameraController = new OrbitCameraController(document, renderer);
    const playerSpawnDebugBlock = new DebugBlock(gameMap.dungeonGenerator.playerSpawn,
      0xffff00,
      1,
      100,
      1);
    scene.add(playerSpawnDebugBlock.mesh);
    const keySpawnDebugBlock = new DebugBlock(gameMap.dungeonGenerator.keySpawn,
      0xff00ff,
      1,
      100,
      1);
    scene.add(keySpawnDebugBlock.mesh);
    const exitSpawnDebugBlock = new DebugBlock(gameMap.dungeonGenerator.exitSpawn,
      0x00ffff,
      1,
      100,
      1);
    scene.add(exitSpawnDebugBlock.mesh);
    const monsterSpawnDebugBlock = new DebugBlock(gameMap.dungeonGenerator.monsterSpawn,
      0x00ff00,
      1,
      100,
      1);
    scene.add(monsterSpawnDebugBlock.mesh);


    // Add debug blocks from dungeonGenerator
    for (let block of gameMap.dungeonGenerator.debugBlocks) {
      scene.add(block.mesh);
    }
  }

  // Add cameraController logic to scene
  scene.add(cameraController.camera);
  scene.add(cameraController.controls.object);




  // First call to animate
  animate();

}




// animate loop
function animate() {
  requestAnimationFrame(animate);
  cameraController.update(clock.getDelta());
  renderer.render(scene, cameraController.camera);
}



init();
// 