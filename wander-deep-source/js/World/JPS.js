import { MinHeap } from '../Util/MinHeap.js';

export class JPS {

  constructor(graph) {
    this.graph = graph;
  }

  // To actually run JPS!
  find(start, end) {
    // Stores all the nodes yet to explore
    let open = new MinHeap();
    // Closed to keep track of visited nodes
    let closed = new Set();

    let parents = new Map();
    let costs = new Map();

    
    open.enqueue(start, 0);
    costs.set(start.id, 0);
    parents.set(start.id, null);


    // Proceed just like A*!
    // while there are still open nodes to look at...
    while (!open.isEmpty()) {
      
      // the best node to look at
      let current = open.dequeue();

      // Mark the node as closed
      closed.add(current.id);

      // If the goal has been reached
      if (current === end) {
        return this.graph.backtrack(end, parents);
      }

      // Identify possible jump points
      // by looking at successors
      let successors = this.identifySuccessors(
                            current, 
                            parents.get(current.id), 
                            end);
    
      for (let successor of successors) {
        if (!closed.has(successor.id)) {

          // Since this is a uniform cost grid
          // Our g cost will be the manhattan distance
          // We know this is a straight line from our current node
          let successorCost = this.graph.manhattanDistance(current, successor);

          // gCost
          let gCost = successorCost + costs.get(current.id);
          // hCost
          let hCost = this.graph.manhattanDistance(successor, end);
          // fCost
          let fCost = gCost + hCost;

          // If the costs does not have our successor OR
          // It's cost is > than the current gCost
          if (!costs.has(successor.id) || (costs.get(successor.id) > gCost)) {

            costs.set(successor.id, gCost);
            parents.set(successor.id, current);
            open.enqueue(successor, fCost);

          }
        }
      }
    }

    return [];
  }

  // Identify our jump points or successors
  identifySuccessors(node, parent, end) {
    let successors = [];
    let neighbours = this.getNeighbours(node, parent);

    for (let neighbour of neighbours) {
      let jumpNode = this.jump(node, neighbour, end);

      if (jumpNode) {
        successors.push(jumpNode);
      }

    }
    
    return successors;

  }
 
  // Get neighbours to search for jump points
  // Ensure we get only the neighbours forward
  getNeighbours(node, parent) {

    let neighbours = [];

    if (parent === null) {
      for (let e of node.edges) {
        neighbours.push(e.node);
      }
    } else {

      let di = node.i - parent.i;
      let dj = node.j - parent.j;

      // First start by moving along the horizontal
      if (di !== 0) {
        
        di = di/Math.abs(di);

        if (node.hasEdgeTo(node.i + di, node.j)) {
          neighbours.push(this.graph.getAt(node.i + di, node.j));
        }

        if (node.hasEdgeTo(node.i, node.j - 1)) {
          neighbours.push(this.graph.getAt(node.i, node.j - 1));
        }
        
        if (node.hasEdgeTo(node.i, node.j + 1)) {
          neighbours.push(this.graph.getAt(node.i, node.j + 1));
        }
      
      // Move along the vertical
      } else if (dj !== 0) {

        dj = dj/Math.abs(dj);

        if (node.hasEdgeTo(node.i, node.j + dj)) {
          neighbours.push(this.graph.getAt(node.i, node.j + dj));
        }

        if (node.hasEdgeTo(node.i - 1, node.j)) {
          neighbours.push(this.graph.getAt(node.i - 1, node.j));
        }

        if (node.hasEdgeTo(node.i + 1, node.j)) {
          neighbours.push(this.graph.getAt(node.i + 1, node.j));
        }
      }
    }
    return neighbours;

  }

  // Find jump points
  jump(current, neighbour, end) {
    
    if (!neighbour || !current.hasEdge(neighbour)) {
      return null;
    }

    if (neighbour === end) {
      return neighbour;
    }

    let di = neighbour.i - current.i;
    let dj = neighbour.j - current.j;

    // Jumping along the horizontal
    if (di !== 0) {
      if ((neighbour.hasEdgeTo(neighbour.i, neighbour.j + 1) 
          && !current.hasEdgeTo(current.i, current.j + 1)) || 
          (neighbour.hasEdgeTo(neighbour.i, neighbour.j - 1)
          && !current.hasEdgeTo(current.i, current.j - 1))) {
        // the neighbour is a jump point!
        return neighbour;
      }
    }

    // Jumping along the vertical
    else if (dj !== 0) {
      if ((neighbour.hasEdgeTo(neighbour.i + 1, neighbour.j) 
          && !current.hasEdgeTo(current.i + 1, current.j)) || 
          (neighbour.hasEdgeTo(neighbour.i - 1, neighbour.j)
          && !current.hasEdgeTo(current.i - 1, current.j))) {
        // the neighbour is a jump point!
        return neighbour;
      }

      let left = this.graph.getAt(neighbour.i - 1, neighbour.j);
      let right = this.graph.getAt(neighbour.i + 1, neighbour.j);

      if ((this.jump(neighbour, left, end) !== null) ||
          (this.jump(neighbour, right, end) !== null)) {
        return neighbour;
      }
    }

    let nextNeighbour = this.graph.getAt(neighbour.i + di, neighbour.j + dj);
    return this.jump(neighbour, nextNeighbour, end);

  }
  

}