import * as THREE from 'three';

// Basic BoxCollider for wall collisions
export class BoxCollider {
    constructor(location, width, depth) {
        this.location = location;
        this.width = width;
        this.depth = depth;
    }
}