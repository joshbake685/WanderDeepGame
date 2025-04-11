import * as THREE from 'three';

export class MathUtil {

  // Get random int in range
  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Manhattan distance between two vectors
  static manhattanDistance(v1, v2) {
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y);
  }

  // Clamp function
  static clamp(value, min, max) {
    if (value < min) {
      return min;
    } else if (value > max) {
      return max;
    }

    return value;
  }

  // Checks player (cylinder collider) for collision with a box collider
  static checkPlayerCollision(playerLocation, playerRadius, boxCollider) {
    const closestX = this.clamp(playerLocation.x, boxCollider.location.x - boxCollider.width / 2, boxCollider.location.x + boxCollider.width / 2);
    const closestZ = this.clamp(playerLocation.z, boxCollider.location.z - boxCollider.depth / 2, boxCollider.location.z + boxCollider.depth / 2);

    const distanceX = playerLocation.x - closestX;
    const distanceZ = playerLocation.z - closestZ;

    // Avoid expensive sqrt operation for just checking if collision has happened
    const distanceSquared = distanceX * distanceX + distanceZ * distanceZ;

    return distanceSquared < playerRadius * playerRadius;
  }

  // Gets penetration vector for player
  static getCollisionOverlap(playerLocation, playerRadius, boxCollider) {
    const closestX = this.clamp(playerLocation.x, boxCollider.location.x - boxCollider.width / 2, boxCollider.location.x + boxCollider.width / 2);
    const closestZ = this.clamp(playerLocation.z, boxCollider.location.z - boxCollider.depth / 2, boxCollider.location.z + boxCollider.depth / 2);

    const distanceX = playerLocation.x - closestX;
    const distanceZ = playerLocation.z - closestZ;
    const distance = Math.sqrt(distanceX * distanceX + distanceZ * distanceZ);

    // Prevent divide by zero
    if (distance === 0) {
      return new THREE.Vector2(0, 0);
    }

    // How far the circle has gone into the box
    const penetrationDepth = playerRadius - distance;

    const direction = new THREE.Vector2(distanceX / distance, distanceZ / distance);
    return direction.multiplyScalar(penetrationDepth);
  }
}