import * as THREE from 'three';
import { GameMap } from './World/GameMap.js';
import { FirstPersonController } from './CameraController/FirstPersonController.js';
import { OrbitCameraController } from './CameraController/OrbitCameraController.js';

const USE_CAMERA_ORBIT = false; // For debugging

// Create Scene
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
let cameraController = null;
let colliders = [];
if (USE_CAMERA_ORBIT) {
  cameraController = new OrbitCameraController(document, renderer);
} else {
  cameraController = new FirstPersonController(document, renderer);
}


// Create clock
const clock = new THREE.Clock();


// Declare our GameMap
let gameMap;



// Setup our scene
function init() {

  scene.background = new THREE.Color(0xffffff);

  // Add it to your scene logic
  scene.add(cameraController.camera);
  scene.add(cameraController.controls.object);

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
  colliders = gameMap.dungeonWallColliders;
  if (!USE_CAMERA_ORBIT) {
    cameraController.colliders = colliders;
  }
  scene.add(gameMap.gameObject);




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