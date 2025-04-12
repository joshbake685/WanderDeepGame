import * as THREE from 'three';
import { GameMap } from './World/GameMap.js';
import { FirstPersonController } from './CameraController/FirstPersonController.js';
import { OrbitCameraController } from './CameraController/OrbitCameraController.js';
import { DebugBlock } from '../DebugBlock.js';
import { Monster } from './Behaviour/Monster.js';
import { DummyPlayer } from './Behaviour/DummyPlayer.js';
import { Key } from './World/Key.js';
import { Exit } from './World/Exit.js';

const USE_CAMERA_ORBIT = false; // For debugging
const ENABLE_ROOF = true;
const SHOW_BEACONS = false;

// Create Scene
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
let cameraController = null;
let dummyPlayer = null;
let monster = null;
let key = null;
let exit = null;
let colliders = [];


// Create clock
const clock = new THREE.Clock();


// Declare our GameMap
let gameMap;



// Setup our scene
function init() {

  scene.background = new THREE.Color(0x000000);

  // Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);

  let brightness = 0.1;
  if (USE_CAMERA_ORBIT) {
    brightness = 1;

    // Directional Light
    let directionalLight = new THREE.DirectionalLight(0xffffff, brightness);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);
  }

  // Ambient Light
  let ambient = new THREE.AmbientLight(0x000000, brightness);
  scene.add(ambient);

  // Create our gameMap
  gameMap = new GameMap();
  scene.add(gameMap.gameObject);

  // Create roof
  if (ENABLE_ROOF) {
    const roofGeometry = new THREE.BoxGeometry(gameMap.bounds.max.x - gameMap.bounds.min.x, 1, gameMap.bounds.max.z - gameMap.bounds.min.z);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
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

    scene.add(cameraController.spotLightTarget);
    scene.add(cameraController.spotLight);
  } else {
    cameraController = new OrbitCameraController(document, renderer);
  }
  if (SHOW_BEACONS) {
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

  // Spawn monster
  if (!USE_CAMERA_ORBIT) {
    monster = new Monster(gameMap, cameraController);
  } else {
    // Add dummy player if in orbit mode
    dummyPlayer = new DummyPlayer(gameMap.dungeonGenerator.playerSpawn, null, gameMap);
    monster = new Monster(gameMap, dummyPlayer);
    dummyPlayer.monster = monster;
    scene.add(dummyPlayer.debugBlock.mesh);
  }
  monster.location = gameMap.dungeonGenerator.monsterSpawn.sub(new THREE.Vector3(0, 2, 0));
  scene.add(monster.gameObject);

  // Spawn key and exit
  key = new Key(gameMap.dungeonGenerator.keySpawn, cameraController, gameMap, scene);
  exit = new Exit(gameMap.dungeonGenerator.exitSpawn, cameraController, gameMap, scene);

  // Add cameraController logic to scene
  scene.add(cameraController.camera);
  scene.add(cameraController.controls.object);




  // First call to animate
  animate();

}




// animate loop
function animate() {
  requestAnimationFrame(animate);
  let delta = clock.getDelta();
  cameraController.update(delta);
  if (dummyPlayer && USE_CAMERA_ORBIT) {
    dummyPlayer.update();
  }
  monster.update(delta, gameMap);

  if (!USE_CAMERA_ORBIT) {
    key.update();
    exit.update();
  }
  renderer.render(scene, cameraController.camera);
}



init();
// 