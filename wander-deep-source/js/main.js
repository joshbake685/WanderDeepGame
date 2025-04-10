import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameMap } from './World/GameMap.js';
import { FirstPersonController } from './FirstPersonController.js';

const USE_CAMERA_ORBIT = false;

// Create Scene
const scene = new THREE.Scene();
//const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const firstPersonController = new FirstPersonController(document, renderer);

// Create clock
const clock = new THREE.Clock();

//const controls = new PointerLockControls(camera, renderer.domElement);
//const controls = new OrbitControls(camera, renderer.domElement);


// Declare our GameMap
let gameMap;



// Setup our scene
function init() {

  scene.background = new THREE.Color(0xffffff);

  // Camera
  // camera.position.y = 180;
  // camera.position.z = 50;
  // camera.lookAt(0, 0, 0);
  // scene.add(camera);

  // FPS controls
  // Add a click listener to lock the pointer
  // document.body.addEventListener('click', () => {
  //   controls.lock();
  // });

  // Add it to your scene logic
  scene.add(firstPersonController.camera);
  scene.add(firstPersonController.controls.object);

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




  // First call to animate
  animate();

}




// animate loop
function animate() {
  requestAnimationFrame(animate);
  firstPersonController.update(clock.getDelta());
  renderer.render(scene, firstPersonController.camera);


}



init();
// 