import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { MinHeap } from '../Util/MinHeap.js';
import { MapNode } from './MapNode.js';
import { MapGraph } from './MapGraph.js';

import { MathUtil } from '../Util/MathUtil.js'
import { Rect } from '../Util/Rect.js';

import { Partition } from './Partition.js';
import { BoxCollider } from '../BoxCollider.js';
import { DebugBlock } from '../../DebugBlock.js';


// Dungeon Generator class
export class DungeonGenerator {

  // Dungeon generator constructor
  constructor(graph, minRoomSize, gameMap) {
    this.graph = graph;
    this.minRoomSize = minRoomSize;
    this.gameMap = gameMap;
    this.colliders = [];

    // Generator will be responsible for finding spawn locations
    this.leafRooms = [];
    this.roomNodes = [];
    this.playerSpawn = new THREE.Vector3();
    this.keySpawn = new THREE.Vector3();
    this.monsterSpawn = new THREE.Vector3();
    this.exitSpawn = new THREE.Vector3();

    // Maps room => corresponding MapNode
    this.roomToNode = new Map();

    // This looks decent
    this.minPartitionSize = Math.ceil(minRoomSize * 1.2);
  }

  // Get farthest room from start
  reverseDijkstraRoom(startRoom) {

    let open = new MinHeap();

    // Our table using Maps
    let costs = new Map();
    let parents = new Map();

    // Add our start node to the set of open nodes
    // Enqueue it at a cost of 0
    open.enqueue(startRoom, 0);

    // Add our first node to costs and parents
    costs.set(startRoom.id, 0);
    parents.set(startRoom.id, null);

    // Continue processing nodes while open is not empty
    while (!open.isEmpty()) {

      let current = open.dequeue();

      for (let edge of current.edges) {

        let neighbour = edge.node;
        let pathCost = edge.cost + costs.get(current.id);

        if (!costs.has(neighbour.id) || (costs.get(neighbour.id) > pathCost)) {
          costs.set(neighbour.id, pathCost);
          parents.set(neighbour.id, current);

          open.enqueue(neighbour, pathCost);
        }
      }
    }

    // Get node with greatest cost
    let maxId = null;
    let maxCost = -Infinity;
    for (const [id, cost] of costs) {
      if (cost > maxCost) {
        maxCost = cost;
        maxId = id;
      }
    }

    const farthestNode = this.roomNodes.find((roomNode) => roomNode.id === maxId);
    if (!farthestNode) {
      throw Error("reverseDijkstraRoom failed to find maxId in this.roomNodes.");
    }

    return farthestNode;
  }

  // Main generate method
  generate() {

    let root = new Partition(0, 0, this.graph.cols, this.graph.rows);
    root.split(this.minPartitionSize);

    // These are the partitions with no children
    let partitions = root.getLeaves();
    let rooms = this.createRooms(partitions);

    // Create connections (MST)
    let connections = this.createConnections(rooms);

    // Pick spawn locations
    let usedLocationsIndices = [];

    // Pick player start position
    const playerSpawnIndex = MathUtil.getRandomInt(0, this.leafRooms.length - 1);
    usedLocationsIndices.push(playerSpawnIndex);
    this.playerSpawn = this.roomCoordsToWorld(this.leafRooms[playerSpawnIndex]);

    // Pick key spawn position
    let keySpawnRoomNode = this.roomNodes[this.roomToNodeIndex(this.leafRooms[playerSpawnIndex])];
    const keySpawnRoom = this.reverseDijkstraRoom(keySpawnRoomNode);
    this.keySpawn = this.gameMap.localize(keySpawnRoom);

    // Pick exit spawn location
    let exitSpawnNode = this.reverseDijkstraRoom(keySpawnRoom);
    this.exitSpawn = this.gameMap.localize(exitSpawnNode);

    // Pick monster spawn location (somewhere close to or with key)
    let numberOfRoomsOver = MathUtil.getRandomInt(0, 5);
    let monsterSpawnRoomNode = keySpawnRoom;
    let lastRoomNode = null;
    for (let i = 0; i < numberOfRoomsOver; i++) {
      // Pick edge to traverse (without backtracking)
      let edgeIndex;
      do {
        edgeIndex = MathUtil.getRandomInt(0, monsterSpawnRoomNode.edges.length - 1);
      } while (monsterSpawnRoomNode.edges[edgeIndex].node === lastRoomNode);
      lastRoomNode = monsterSpawnRoomNode;
      monsterSpawnRoomNode = monsterSpawnRoomNode.edges[edgeIndex].node;
    }
    this.monsterSpawn = this.gameMap.localize(monsterSpawnRoomNode);

    //console.log("this.keySpawn:", this.keySpawn, "this.exitSpawn:", this.exitSpawn);

    // Iterate over all of the connections
    // Creating a corridor between them
    for (let con of connections) {
      this.carveCorridor(con.from, con.to);
    }

    // Connect up our graph
    this.graph.createEdges();

    // Lastly, create wall colliders
    this.createWallColliders();
  }

  // Create rooms
  createRooms(partitions) {

    // Initialize an empty array of rooms
    let rooms = [];

    // For each partition, centerate a random room that fits
    for (let part of partitions) {

      let roomWidth = MathUtil.getRandomInt(this.minRoomSize, part.rect.w - 2);
      let roomHeight = MathUtil.getRandomInt(this.minRoomSize, part.rect.h - 2);

      let roomX = MathUtil.getRandomInt(part.rect.x + 1, part.rect.x + part.rect.w - roomWidth - 1);
      let roomY = MathUtil.getRandomInt(part.rect.y + 1, part.rect.y + part.rect.h - roomHeight - 1);

      // Push our room to our list of rooms
      const room = new Rect(roomX, roomY, roomWidth, roomHeight);
      rooms.push(room);

      // Set the tiles in each room to be groud or traversable
      for (let i = roomX; i < roomX + roomWidth; i++) {
        for (let j = roomY; j < roomY + roomHeight; j++) {
          let node = this.graph.getAt(i, j);
          node.type = MapNode.Type.Ground;
        }
      }
    }
    return rooms;
  }

  // Returns equivalent node of room's coordinates on mapGraph
  roomCoordsToNode(room) {
    return this.graph.getAt(room.x + Math.round(room.w / 2), room.y + Math.round(room.h / 2));
  }

  // Returns center of provided room in world coordinates
  roomCoordsToWorld(room) {
    return this.gameMap.localize(this.roomCoordsToNode(room));
  }

  // Returns roomNode index corresponding to provided room (Rect)
  roomToNodeIndex(room) {
    let roomNodeIndex = -1;
    let roomNodeConversion = this.roomCoordsToNode(room);
    for (let i = 0; i < this.roomNodes.length; i++) {
      if (this.roomNodes[i].i === roomNodeConversion.i && this.roomNodes[i].j === roomNodeConversion.j) {
        roomNodeIndex = i;
        break;
      }
    }

    if (roomNodeIndex === -1) {
      throw Error("roomToNodeIndex conversion failed.");
    }

    //console.log("roomNodeIndex", roomNodeIndex);
    return roomNodeIndex;
  }

  // Create connections between our rooms
  // Finding the MST (minimum spanning tree)
  createConnections(rooms) {
    let connections = [];

    // Create root roomNode
    const rootRoom = rooms[0];
    const rootNodeConversion = this.roomCoordsToNode(rootRoom);
    const rootNode = new MapNode(this.roomNodes.length, rootNodeConversion.i, rootNodeConversion.j);
    this.roomNodes.push(rootNode);
    this.roomToNode.set(rootRoom, rootNode);

    let connected = new Set([rootRoom]);
    let remaining = new Set(rooms.slice(1));

    while (remaining.size > 0) {
      let best = Infinity;
      let from = null;
      let to = null;

      for (let r1 of connected) {
        for (let r2 of remaining) {
          let dist = MathUtil.manhattanDistance(r1.getCenter(), r2.getCenter());
          if (dist < best) {
            best = dist;
            from = r1;
            to = r2;
          }
        }
      }

      // Create MapNode for the new room
      const toNodeConversion = this.roomCoordsToNode(to);
      const toNode = new MapNode(this.roomNodes.length, toNodeConversion.i, toNodeConversion.j, MapNode.Type.Ground);
      this.roomNodes.push(toNode);
      this.roomToNode.set(to, toNode);

      // Get fromNode from map
      const fromNode = this.roomToNode.get(from);
      fromNode.addEdge(toNode, 1);
      toNode.addEdge(fromNode, 1); // Add this if you want bidirectional edges

      connected.add(to);
      remaining.delete(to);
      connections.push({ from, to });
    }

    // Find leaf rooms
    let connectionCount = new Map();

    for (let conn of connections) {
      connectionCount.set(conn.from, (connectionCount.get(conn.from) || 0) + 1);
      connectionCount.set(conn.to, (connectionCount.get(conn.to) || 0) + 1);
    }
    this.debugBlocks = [];
    for (let room of rooms) {
      if (connectionCount.get(room) === 1) {
        this.leafRooms.push(room);
        const debugBlock = new DebugBlock(this.roomCoordsToWorld(room), 0xff0000, 1, 100, 1);
        this.debugBlocks.push(debugBlock);
      }
    }
    this.roomNodes.forEach((roomNode) => console.log("edges:", roomNode.edges.length));

    return connections;
  }

  // Carve corridor between room a and room b
  // via their centers
  carveCorridor(a, b) {
    let centerA = a.getCenter();
    let centerB = b.getCenter();

    if (Math.random() < 0.5) {
      // Horizontal, then vertical
      this.carveHorizontal(centerA.x, centerB.x, centerA.y);
      this.carveVertical(centerA.y, centerB.y, centerB.x);
    } else {
      // Vertical, then horizontal
      this.carveVertical(centerA.y, centerB.y, centerA.x);
      this.carveHorizontal(centerA.x, centerB.x, centerB.y);
    }

  }

  // Carve a horizontal path
  carveHorizontal(x1, x2, y) {
    let start = Math.min(x1, x2);
    let end = Math.max(x1, x2);

    // Iterate from start to end of the corridor
    for (let x = start; x <= end; x++) {
      let node = this.graph.getAt(x, y);
      node.type = MapNode.Type.Ground;
    }
  }

  // Carve a vertical path
  carveVertical(y1, y2, x) {
    let start = Math.min(y1, y2);
    let end = Math.max(y1, y2);

    // Iterate from start to end of the corridor
    for (let y = start; y <= end; y++) {
      let node = this.graph.getAt(x, y);
      node.type = MapNode.Type.Ground;
    }
  }

  createWallColliders() {

    for (let node of this.graph.nodes) {
      if (node.type === MapNode.Type.Obstacle) {

        // Add collider to list
        let boxCollider = new BoxCollider(this.gameMap.localize(node), this.gameMap.tileSize, this.gameMap.tileSize);
        this.colliders.push(boxCollider);
      }
    }
  }
}













