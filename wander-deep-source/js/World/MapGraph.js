import * as THREE from 'three';
import { MapNode } from './MapNode.js';


export class MapGraph {

  // Constructor for our MapGraph class
  constructor(cols, rows) {

    // node array for our Graph class
    this.nodes = [];

    // Columns and rows
    // as instance variables
    this.cols = cols;
    this.rows = rows;

    // Create nodes and edges
    this.createNodes();
    this.createEdges();
  }

  // Get a node at a particular index
  get(index) {
    return this.nodes[index];
  }

  // Get a node at i and j indices
  getAt(i, j) {
    return this.get(j * this.cols + i);
  }

  // The number of nodes in our graph
  length() {
    return this.nodes.length;
  }


  // Create tile-based nodes
  createNodes() {
    // Loop over all rows and columns
    // to create all of our nodes
    // and add them to our node array
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {

        let type = MapNode.Type.Obstacle;

        let node = new MapNode(this.length(), i, j, type);
        this.nodes.push(node);

      }
    }
  }

  // Create tile-based edges
  createEdges() {

    // Loop over all rows and columns
    // to create all of our edges
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {

        // The index of our current node
        let index = j * this.cols + i
        let current = this.nodes[index];

        // Check if the current node is traversable
        if (current.isTraversable()) {

          if (i > 0) {
            let west = this.nodes[index - 1];
            current.tryAddEdge(west, 1);
          }

          if (i < this.cols - 1) {
            let east = this.nodes[index + 1];
            current.tryAddEdge(east, 1);
          }

          if (j > 0) {
            let north = this.nodes[index - this.cols];
            current.tryAddEdge(north, 1);
          }

          if (j < this.rows - 1) {
            let south = this.nodes[index + this.cols];
            current.tryAddEdge(south, 1);
          }
        }
      }
    }
  }

  // Method to get a random ground node
  getRandomGroundNode() {
    // Filter for ground nodes
    let groundNodes = this.nodes.filter(node => node.type === MapNode.Type.Ground);

    if (groundNodes.length === 0) {
      console.log("No ground nodes available.");
      return null;
    }
    // Random index from the list of ground nodes
    let randomIndex = Math.floor(Math.random() * groundNodes.length);
    return groundNodes[randomIndex];
  }



  // STARTING PATHFINDING!!!
  dijkstra(start) {

    let open = new MinHeap();

    // Our table using Maps
    let costs = new Map();
    let parents = new Map();

    // Add our start node to the set of open nodes
    // Enqueue it at a cost of 0
    open.enqueue(start, 0);

    // Add our first node to costs and parents
    costs.set(start.id, 0);
    parents.set(start.id, null);

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

    return parents;
  }

  // Method to use our parents Map
  // to find a path to the specified end node
  backtrack(end, parents) {
    let path = [];
    let current = end;

    if (!parents.has(end.id)) {
      console.log("There is no path to the node: " + end.id);
      return path;
    }

    // Traverse backwards using our parent Map
    while (current !== null) {
      path.unshift(current);
      current = parents.get(current.id);
    }

    return path;
  }

  // Manhattan Distance heuristic
  manhattanDistance(node, end) {
    return Math.abs(node.i - end.i) + Math.abs(node.j - end.j);
  }

  // A* pathfinding
  // Heuristic is passed in as an argument
  // so you can change it depending on requirements
  aStar(start, end, heuristic) {

    // Keep track of open nodes, costs, and parents
    let open = new MinHeap();
    let costs = new Map();
    let parents = new Map();

    // Add the start node to our open, costs, and parents
    open.enqueue(start, 0);
    costs.set(start.id, 0);
    parents.set(start.id, null);

    // While open still has nodes to traverse
    while (!open.isEmpty()) {

      // Get the lowest F cost node
      let current = open.dequeue();

      // If we've reached the end,
      // we know this is the lowest cost
      // Reconstruct the path
      if (current === end) {
        return this.backtrack(end, parents);
      }

      // Look at current's neighbours
      for (let edge of current.edges) {

        let neighbour = edge.node;

        // gCost is our original cost
        let gCost = edge.cost + costs.get(current.id);
        // hCost is our cost based on the heuristic
        let hCost = heuristic(neighbour, end);
        // fCost is combining the two
        let fCost = gCost + hCost;

        // If costs does not have our neighbour OR
        // It's cost is > than the current gCost
        if (!costs.has(neighbour.id) || (costs.get(neighbour.id) > gCost)) {
          // Add neighbour to our costs, parents, and open
          costs.set(neighbour.id, gCost);
          parents.set(neighbour.id, current);

          open.enqueue(neighbour, fCost);
        }

      }

    }
    // We haven't found a path
    return [];

  }


}