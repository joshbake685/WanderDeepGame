import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NPC } from './Behaviour/NPC.js';
import { Guard } from './Behaviour/Guard.js';


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


// Create guard
const enemy = new NPC('red');
const guard = new Guard('blue', enemy);



// Setup our scene
function init() {

  scene.background = new THREE.Color(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.y = 80;
  camera.lookAt(0,0,0);

  // Create Light
  let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(0, 5, 5);
  scene.add(directionalLight);

  // Initialize bounds
  bounds = new THREE.Box3(
    new THREE.Vector3(-50,0,-50), // scene min
    new THREE.Vector3(50,0,50) // scene max
  );

  guard.location.x = Math.random()*(bounds.max.x - bounds.min.x) + bounds.min.x;
  guard.location.z = Math.random()*(bounds.max.z - bounds.min.z) + bounds.min.z;

  enemy.location.x = Math.random()*(bounds.max.x - bounds.min.x) + bounds.min.x;
  enemy.location.z = Math.random()*(bounds.max.z - bounds.min.z) + bounds.min.z;


  // Add the characters to the scene
  scene.add(guard.gameObject);
  scene.add(enemy.gameObject);


  // First call to animate
  animate();
}




// animate loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // Change in time
  let deltaTime = clock.getDelta();
  
  // Apply our steering forces
  enemy.applyForce(enemy.wander());

  // update our characters
  // Updated line 83 since class just so there is no error
  guard.update(deltaTime, bounds, enemy);
  enemy.update(deltaTime, bounds);
}


init();
