import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Controller } from './Behaviour/Controller.js';
import { NPC } from './Behaviour/NPC.js';
import { Player } from './Behaviour/Player.js';

// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

scene.add( camera );

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );

// Create clock
const clock = new THREE.Clock();

// Declare bounds
let bounds;

// Create controller
let controller = new Controller(document, camera);

// Create characters
let player = new Player('blue');


// Setup our scene
function init() {

  scene.background = new THREE.Color(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  document.body.appendChild(renderer.domElement);

  camera.position.y = 80;
  camera.lookAt(0,0,0);

  // Initialize bounds
  bounds = new THREE.Box3(
    new THREE.Vector3(-80,0,-50), // scene min
    new THREE.Vector3(80,0,50) // scene max
  );

  // Create Light
  let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(0, 40, 5);

  // Set up shadow boundaries
  // This is mostly just to show shadows jumping
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = bounds.min.x;
  directionalLight.shadow.camera.right = bounds.max.x;
  directionalLight.shadow.camera.top = bounds.max.z;
  directionalLight.shadow.camera.bottom = bounds.min.z;
  directionalLight.castShadow = true;

  scene.add(directionalLight);

  // Ground to see the jumping
  let groundGeo = new THREE.BoxGeometry(bounds.max.x - bounds.min.x, 0.1, bounds.max.z - bounds.min.z);
  let groundMat = new THREE.MeshStandardMaterial({color: 0x009900});
  let ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);


  player.location.x = Math.random()*(bounds.max.x - bounds.min.x) + bounds.min.x;
  player.location.z = Math.random()*(bounds.max.z - bounds.min.z) + bounds.min.z;

  // Add the characters to the scene
  scene.add(player.gameObject);

  // First call to animate
  animate();
}



// animate loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // Change in time
  let deltaTime = clock.getDelta();

  // update our characters
  player.update(deltaTime, bounds, controller);
}


init();
