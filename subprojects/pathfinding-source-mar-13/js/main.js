import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameMap } from './World/GameMap.js';
import { NPC } from './Behaviour/NPC.js';


// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

// Create clock
const clock = new THREE.Clock();

// Declare our GameMap
let gameMap;

// Declare an NPC
let npc;

// Declare the path to follow
let path;


// Setup our scene
function init() {
  
  scene.background = new THREE.Color(0xffffff);
  
  // Camera
  camera.position.y = 180;
  camera.position.z = 50;
  camera.lookAt(0,0,0);
  scene.add(camera);
  
  // Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create Light
  let directionalLight = new THREE.DirectionalLight(0xffffff, 5);
  directionalLight.position.set(0, 5, 5);
  scene.add(directionalLight);

  // Create our gameMap
  gameMap = new GameMap();
  scene.add(gameMap.gameObject);

  // Create a start and end for our path
  let start = gameMap.mapGraph.getRandomGroundNode();
  // let end = gameMap.mapGraph.getRandomGroundNode();

  // Make end node always be farthest from start
  let end = gameMap.mapGraph.reverseDijkstraNode(start);

  // Call path find on start to end
  path = gameMap.pathFind(start, end);

  // Create and place our NPC
  npc = new NPC('red');
  npc.location = gameMap.localize(start);
  scene.add(npc.gameObject);

  // First call to animate
  animate();
  
}




// animate loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  let deltaTime = clock.getDelta();

  // Call simple follow on our path
  let steer = npc.simpleFollow(path);
  npc.applyForce(steer);

  // Update our NPC
  npc.update(deltaTime, gameMap);


}



init();
