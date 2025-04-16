import * as THREE from 'three';
import { GameMap } from './World/GameMap.js';
import { FirstPersonController } from './CameraController/FirstPersonController.js';
import { OrbitCameraController } from './CameraController/OrbitCameraController.js';
import { DebugBlock } from './DebugBlock.js';
import { Monster } from './Behaviour/Monster.js';
import { DummyPlayer } from './Behaviour/DummyPlayer.js';
import { Key } from './World/Key.js';
import { Exit } from './World/Exit.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

// Materials
let groundMaterial = null;
let wallMaterial = null;
let ceilingMaterial = null;

// Models
let monsterModel = null;

let colliders = [];


// Create clock
const clock = new THREE.Clock();


// Declare our GameMap
let gameMap;

// Returns promise that resolves once all textures are loaded
async function loadTextures() {
  const textureLoader = new THREE.TextureLoader();

  // Floor textures
  const floorDiffuseMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/floor_bricks_02_4k.gltf/textures/floor_bricks_02_diff_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });
  const floorNormalMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/floor_bricks_02_4k.gltf/textures/floor_bricks_02_nor_gl_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });
  const floorRoughnessMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/floor_bricks_02_4k.gltf/textures/floor_bricks_02_rough_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });

  // Wall textures
  const wallDiffuseMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/castle_wall_varriation_4k.gltf/textures/castle_wall_varriation_diff_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });
  const wallNormalMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/castle_wall_varriation_4k.gltf/textures/castle_wall_varriation_nor_gl_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });
  const wallRoughnessMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/castle_wall_varriation_4k.gltf/textures/castle_wall_varriation_rough_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });

  // Ceiling textures
  const ceilingDiffuseMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/cracked_concrete_wall_4k.gltf/textures/cracked_concrete_wall_diff_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });
  const ceilingNormalMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/cracked_concrete_wall_4k.gltf/textures/cracked_concrete_wall_nor_gl_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });
  const ceilingRoughnessMapPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      './textures/cracked_concrete_wall_4k.gltf/textures/cracked_concrete_wall_rough_4k.jpg',
      resolve,
      undefined,
      reject
    );
  });

  return Promise.all([floorDiffuseMapPromise, floorNormalMapPromise, floorRoughnessMapPromise, wallDiffuseMapPromise, wallNormalMapPromise, wallRoughnessMapPromise, ceilingDiffuseMapPromise, ceilingNormalMapPromise, ceilingRoughnessMapPromise])
    .then(([floorDiffuseMap, floorNormalMap, floorRoughnessMap, wallDiffuseMap, wallNormalMap, wallRoughnessMap, ceilingDiffuseMap, ceilingNormalMap, ceilingRoughnessMap]) => {
      groundMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: floorDiffuseMap,
        normalMap: floorNormalMap,
        roughnessMap: floorRoughnessMap,
        roughness: 1,
        flatShading: false
      });

      wallMaterial = new THREE.MeshStandardMaterial({
        map: wallDiffuseMap,
        normalMap: wallNormalMap,
        roughnessMap: wallRoughnessMap,
        roughness: 1,
        flatShading: false
      });

      ceilingMaterial = new THREE.MeshStandardMaterial({
        map: ceilingDiffuseMap,
        normalMap: ceilingNormalMap,
        roughnessMap: ceilingRoughnessMap,
        roughness: 1,
        flatShading: false
      });
    }).catch((err) => {
      console.error("Error loading textures: ", err);
    });
}

// Returns promise that resolves once all models are loaded
async function loadModels() {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load('./models/monster_walking.glb', (gltf) => {
      const monsterModel = gltf.scene;
      const animations = gltf.animations;
      monsterModel.animations = animations;
      resolve(monsterModel);
    }, undefined, (error) => {
      reject(error);
    });
  });
}

// Setup our scene
function init() {
  scene.background = new THREE.Color(0xffffff);

  // Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  let brightness = 0.1;
  if (USE_CAMERA_ORBIT) {
    brightness = 1;

    // Directional Light
    let directionalLight = new THREE.DirectionalLight(0xffffff, brightness);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);
  }

  // Create our gameMap
  gameMap = new GameMap(groundMaterial, wallMaterial);
  scene.add(gameMap.gameObject);

  // Create roof
  if (ENABLE_ROOF) {
    const roofGeometry = new THREE.BoxGeometry(gameMap.bounds.max.x - gameMap.bounds.min.x, 1, gameMap.bounds.max.z - gameMap.bounds.min.z);
    const roofMesh = new THREE.Mesh(roofGeometry, ceilingMaterial);
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
    monster = new Monster(gameMap, cameraController, scene, monsterModel);
  } else {
    // Add dummy player if in orbit mode
    dummyPlayer = new DummyPlayer(gameMap.dungeonGenerator.playerSpawn, null, gameMap);
    monster = new Monster(gameMap, dummyPlayer, scene, monsterModel);
    dummyPlayer.monster = monster;
    scene.add(dummyPlayer.debugBlock.mesh);
  }
  let spawnLocation = gameMap.dungeonGenerator.monsterSpawn.clone();
  monster.location.set(spawnLocation.x, spawnLocation.y, spawnLocation.z);

  // Spawn key and exit
  key = new Key(gameMap.dungeonGenerator.keySpawn, cameraController, gameMap, scene);
  exit = new Exit(gameMap.dungeonGenerator.exitSpawn, cameraController, gameMap, scene);

  // Add cameraController logic to scene
  scene.add(cameraController.camera);
  scene.add(cameraController.controls.object);

  // First call to animate
  animate();
}

// Restarts game by refreshing tab
function restartGame() {
  window.location.reload();
}
window.restartGame = restartGame;


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


loadTextures().then(() => {
  return loadModels();
}).then((loadedModel) => {
  monsterModel = loadedModel;
  init();
}).catch((error) => {
  console.error("Error loading assets:", error);
});