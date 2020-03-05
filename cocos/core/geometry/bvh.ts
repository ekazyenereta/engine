import aabb from './aabb';

export class BvhTree {
    
}

export class BvhNode {
    aabb: aabb;
    index: number;
    count: number;
    left: BvhNode;
    right: BvhNode
}
