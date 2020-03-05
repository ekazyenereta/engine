import { Model } from "./model";
import { IVec3Like } from "../../math/type-define";
import { Vec3 } from "@cocos/cannon";
import { obb, aabb, ray, intersect, triangle } from "../../geometry";

interface IBVHBuildOptions {
    strategy: EBVHSplitStrategy | 0,
    maxDepth: number | 40,
    maxLeafTris: number | 10,
    verbose: boolean | true,
    lazyGeneration: boolean | true,
    packData: boolean | true,
}

enum EBVHSplitStrategy {
    CENTER,
    AVERAGE,
    SAH, //Surface Area Heuristic
}

const SKIP_GENERATION = Symbol('skip tree generation');
export class MeshBVH {
    _isPacked = false;
    _roots!: MeshBVHNode[];
    splitStrategy: EBVHSplitStrategy = EBVHSplitStrategy.CENTER;
    constructor (model: Model, options?: IBVHBuildOptions) {
        options = Object.assign({
            strategy: CENTER,
            maxDepth: 40,
            maxLeafTris: 10,
            verbose: true,
            lazyGeneration: false,

            // undocumented options

            // whether to the pack the data as a buffer or not. The data
            // will not be packed if lazyGeneration is true.
            packData: true,

            // Whether to skip generating the tree. Used for deserialization.
            [SKIP_GENERATION]: false

        }, options);
        options.strategy = Math.max(0, Math.min(2, options.strategy));
        if (!options[SKIP_GENERATION]) {
            this._roots = buildTree(model, options);
            // if (!options.lazyGeneration && options.packData) {
            //     this._roots = MeshBVH.serialize(this, model, false).roots;
            //     this._isPacked = true;
            // }
        }
    }

    traverse (callback, rootIndex = 0) {

        // if ( this._isPacked ) {

        // 	const buffer = this._roots[ rootIndex ];
        // 	const uint32Array = new Uint32Array( buffer );
        // 	const uint16Array = new Uint16Array( buffer );
        // 	_traverseBuffer( 0 );

        // 	function _traverseBuffer( stride4Offset, depth = 0 ) {

        // 		const stride2Offset = stride4Offset * 2;
        // 		const isLeaf = uint16Array[ stride2Offset + 15 ];
        // 		if ( isLeaf ) {

        // 			const offset = uint32Array[ stride4Offset + 6 ];
        // 			const count = uint16Array[ stride2Offset + 14 ];
        // 			callback( depth, isLeaf, new Float32Array( buffer, stride4Offset * 4, 6 ), offset, count );

        // 		} else {

        // 			const left = stride4Offset + BYTES_PER_NODE / 4;
        // 			const right = uint32Array[ stride4Offset + 6 ];
        // 			const splitAxis = uint32Array[ stride4Offset + 7 ];
        // 			callback( depth, isLeaf, new Float32Array( buffer, stride4Offset * 4, 6 ), splitAxis, false );

        // 			_traverseBuffer( left, depth + 1 );
        // 			_traverseBuffer( right, depth + 1 );

        // 		}

        // 	}

        // } else {

        _traverseNode(this._roots[rootIndex]);

        function _traverseNode (node, depth = 0) {

            const isLeaf = ! !node.count;
            if (isLeaf) {

                callback(depth, isLeaf, node.boundingData, node.offset, node.count);

            } else {

                callback(depth, isLeaf, node.boundingData, node.splitAxis, ! !node.continueGeneration);
                if (node.left) _traverseNode(node.left, depth + 1);
                if (node.right) _traverseNode(node.right, depth + 1);

            }

        }

        // }

    }

    raycast (mesh, raycaster, ray, intersects) {
        for (const root of this._roots) {

        }

    }

    raycastClosest () {

    }
}

function raycast (model: Model, ray: ray, node: MeshBVHNode) {

    if (node.continueGeneration) {
        node.continueGeneration();
    }

    const isLeaf = !!node.count;
    if (isLeaf) {
        const tri = new triangle();
        const geo = model.getSubModel(0).subMeshData.geometricInfo!;
        const indices = geo.indices!;
        const positions = geo.positions!;
        for (let i = node.offset, end = node.offset + node.count; i < end; i++) {            
            const triOffset = i * 3;
            // const a = geo.index.getX(triOffset);
            // const b = geo.index.getX(triOffset + 1);
            // const c = geo.index.getX(triOffset + 2);
            // Vec3.set(tri.a, )
            const dist = intersect.ray_triangle(ray, tri, true);
        }
    } else {

        if (ray_aabb_flat(ray, node.left.boundingData)) {
            raycast(model, ray, node.left);
        }

        if (ray_aabb_flat(ray, node.right.boundingData)) {
            raycast(model, ray, node.right);
        }
    }
}

function ray_aabb_flat (ray: ray, flatBuffer: Float32Array) {
    const box = new aabb();
    arrayToBox(flatBuffer, box);
    return intersect.ray_aabb(ray, box);
}



class MeshBVHNode {
    boundingData!: Float32Array;
    splitAxis: number | 0 | 1 | 2 = 0;
    left!: MeshBVHNode;
    right!: MeshBVHNode;
    continueGeneration: any;
    offset = 0;
    count = 0;
}

// Split strategy constants
const CENTER = 0;
const AVERAGE = 1;
const SAH = 2;
// Returns a Float32Array representing the bounds data for box.
function boxToArray (bx: aabb) {

    const arr = new Float32Array(6);

    arr[0] = bx.min.x;
    arr[1] = bx.min.y;
    arr[2] = bx.min.z;

    arr[3] = bx.max.x;
    arr[4] = bx.max.y;
    arr[5] = bx.max.z;

    return arr;

}

function arrayToBox (arr: Float32Array, target: aabb) {

    target.min.x = arr[0];
    target.min.y = arr[1];
    target.min.z = arr[2];

    target.max.x = arr[3];
    target.max.y = arr[4];
    target.max.z = arr[5];

    return target;

}

function getLongestEdgeIndex (bounds: Float32Array) {

    let splitDimIdx = - 1;
    let splitDist = - Infinity;

    for (let i = 0; i < 3; i++) {

        const dist = bounds[i + 3] - bounds[i];
        if (dist > splitDist) {

            splitDist = dist;
            splitDimIdx = i;

        }

    }

    return splitDimIdx;

}

const xyzFields = ['x', 'y', 'z'];
const boxTemp = new aabb();

// TODO: ensure index
function ensureIndex (geo: Model) {
    // if (!geo.index) {

    //     const vertexCount = geo.attributes.position.count;
    //     const index = new (vertexCount > 65535 ? Uint32Array : Uint16Array)(vertexCount);
    //     // geo.setIndex(new BufferAttribute(index, 1));

    //     for (let i = 0; i < vertexCount; i++) {

    //         index[i] = i;

    //     }

    // }

}

// TODO: handle offset
// Computes the set of { offset, count } ranges which need independent BVH roots. Each
// region in the geometry index that belongs to a different set of material groups requires
// a separate BVH root, so that triangles indices belonging to one group never get swapped
// with triangle indices belongs to another group. For example, if the groups were like this:
//
// [-------------------------------------------------------------]
// |__________________|
//   g0 = [0, 20]  |______________________||_____________________|
//                      g1 = [16, 40]           g2 = [41, 60]
//
// we would need four BVH roots: [0, 15], [16, 20], [21, 40], [41, 60].
function getRootIndexRanges (geo: Model) {

    return [{ offset: 0, count: geo.getSubModel(0).subMeshData.geometricInfo!.indices!.length / 3 }];

    // if (!geo.groups || !geo.groups.length) {
    //     return [{ offset: 0, count: geo.index.count / 3 }];
    // }

    // const ranges = [];
    // const rangeBoundaries = new Set();
    // for (const group of geo.groups) {

    //     rangeBoundaries.add(group.start);
    //     rangeBoundaries.add(group.start + group.count);

    // }

    // // note that if you don't pass in a comparator, it sorts them lexicographically as strings :-(
    // const sortedBoundaries = Array.from(rangeBoundaries.values()).sort((a, b) => a - b);
    // for (let i = 0; i < sortedBoundaries.length - 1; i++) {

    //     const start = sortedBoundaries[i], end = sortedBoundaries[i + 1];
    //     ranges.push({ offset: (start / 3), count: (end - start) / 3 });

    // }
    // return ranges;

}

// computes the union of the bounds of all of the given triangles and puts the resulting box in target. If
// centroidTarget is provided then a bounding box is computed for the centroids of the triangles, as well.
// These are computed together to avoid redundant accesses to bounds array.
function getBounds (triangleBounds: Float32Array, offset: number, count: number, target: Float32Array, centroidTarget: Float32Array | null = null) {

    let minx = Infinity;
    let miny = Infinity;
    let minz = Infinity;
    let maxx = - Infinity;
    let maxy = - Infinity;
    let maxz = - Infinity;

    let cminx = Infinity;
    let cminy = Infinity;
    let cminz = Infinity;
    let cmaxx = - Infinity;
    let cmaxy = - Infinity;
    let cmaxz = - Infinity;

    const includeCentroid = centroidTarget !== null;
    for (let i = offset * 6, end = (offset + count) * 6; i < end; i += 6) {

        const cx = triangleBounds[i + 0];
        const hx = triangleBounds[i + 1];
        const lx = cx - hx;
        const rx = cx + hx;
        if (lx < minx) minx = lx;
        if (rx > maxx) maxx = rx;
        if (includeCentroid && cx < cminx) cminx = cx;
        if (includeCentroid && cx > cmaxx) cmaxx = cx;

        const cy = triangleBounds[i + 2];
        const hy = triangleBounds[i + 3];
        const ly = cy - hy;
        const ry = cy + hy;
        if (ly < miny) miny = ly;
        if (ry > maxy) maxy = ry;
        if (includeCentroid && cy < cminy) cminy = cy;
        if (includeCentroid && cy > cmaxy) cmaxy = cy;

        const cz = triangleBounds[i + 4];
        const hz = triangleBounds[i + 5];
        const lz = cz - hz;
        const rz = cz + hz;
        if (lz < minz) minz = lz;
        if (rz > maxz) maxz = rz;
        if (includeCentroid && cz < cminz) cminz = cz;
        if (includeCentroid && cz > cmaxz) cmaxz = cz;

    }

    target[0] = minx;
    target[1] = miny;
    target[2] = minz;

    target[3] = maxx;
    target[4] = maxy;
    target[5] = maxz;

    if (includeCentroid) {

        centroidTarget![0] = cminx;
        centroidTarget![1] = cminy;
        centroidTarget![2] = cminz;

        centroidTarget![3] = cmaxx;
        centroidTarget![4] = cmaxy;
        centroidTarget![5] = cmaxz;

    }

}

// A stand alone function for retrieving the centroid bounds.
function getCentroidBounds (triangleBounds: Float32Array, offset: number, count: number, centroidTarget: Float32Array) {

    let cminx = Infinity;
    let cminy = Infinity;
    let cminz = Infinity;
    let cmaxx = - Infinity;
    let cmaxy = - Infinity;
    let cmaxz = - Infinity;

    for (let i = offset * 6, end = (offset + count) * 6; i < end; i += 6) {

        const cx = triangleBounds[i + 0];
        if (cx < cminx) cminx = cx;
        if (cx > cmaxx) cmaxx = cx;

        const cy = triangleBounds[i + 2];
        if (cy < cminy) cminy = cy;
        if (cy > cmaxy) cmaxy = cy;

        const cz = triangleBounds[i + 4];
        if (cz < cminz) cminz = cz;
        if (cz > cmaxz) cmaxz = cz;

    }

    centroidTarget[0] = cminx;
    centroidTarget[1] = cminy;
    centroidTarget[2] = cminz;

    centroidTarget[3] = cmaxx;
    centroidTarget[4] = cmaxy;
    centroidTarget[5] = cmaxz;

}


// reorders `tris` such that for `count` elements after `offset`, elements on the left side of the split
// will be on the left and elements on the right side of the split will be on the right. returns the index
// of the first element on the right side, or offset + count if there are no elements on the right side.
function partition (index: Uint16Array, triangleBounds: Float32Array, sahPlanes: any, offset: number, count: number, split: any) {

    let left = offset;
    let right = offset + count - 1;
    const pos = split.pos;
    const axisOffset = split.axis * 2;

    // hoare partitioning, see e.g. https://en.wikipedia.org/wiki/Quicksort#Hoare_partition_scheme
    while (true) {

        while (left <= right && triangleBounds[left * 6 + axisOffset] < pos) {

            left++;

        }

        while (left <= right && triangleBounds[right * 6 + axisOffset] >= pos) {

            right--;

        }

        if (left < right) {

            // we need to swap all of the information associated with the triangles at index
            // left and right; that's the verts in the geometry index, the bounds,
            // and perhaps the SAH planes

            for (let i = 0; i < 3; i++) {

                let t0 = index[left * 3 + i];
                index[left * 3 + i] = index[right * 3 + i];
                index[right * 3 + i] = t0;

                let t1 = triangleBounds[left * 6 + i * 2 + 0];
                triangleBounds[left * 6 + i * 2 + 0] = triangleBounds[right * 6 + i * 2 + 0];
                triangleBounds[right * 6 + i * 2 + 0] = t1;

                let t2 = triangleBounds[left * 6 + i * 2 + 1];
                triangleBounds[left * 6 + i * 2 + 1] = triangleBounds[right * 6 + i * 2 + 1];
                triangleBounds[right * 6 + i * 2 + 1] = t2;

            }

            if (sahPlanes) {

                for (let i = 0; i < 3; i++) {

                    let t = sahPlanes[i][left];
                    sahPlanes[i][left] = sahPlanes[i][right];
                    sahPlanes[i][right] = t;

                }

            }

            left++;
            right--;

        } else {

            return left;

        }

    }

}

function getOptimalSplit (nodeBoundingData: Float32Array, centroidBoundingData: Float32Array, triangleBounds: Float32Array,
    sahPlanes: [object[], object[], object[]] | null, offset: number, count: number, strategy: EBVHSplitStrategy) {

    let axis = - 1;
    let pos = 0;

    // Center
    if (strategy === CENTER) {

        axis = getLongestEdgeIndex(centroidBoundingData);
        if (axis !== - 1) {

            pos = (centroidBoundingData[axis] + centroidBoundingData[axis + 3]) / 2;

        }

    } else if (strategy === AVERAGE) {

        axis = getLongestEdgeIndex(nodeBoundingData);
        if (axis !== - 1) {

            pos = getAverage(triangleBounds, offset, count, axis);

        }

    } else if (strategy === SAH) {

        // Surface Area Heuristic
        // In order to make this code more terse, the x, y, and z
        // variables of various structures have been stuffed into
        // 0, 1, and 2 array indices so they can be easily computed
        // and accessed within array iteration

        // Cost values defineed for operations. We're using bounds for traversal, so
        // the cost of traversing one more layer is more than intersecting a triangle.
        const TRAVERSAL_COST = 3;
        const INTERSECTION_COST = 1;
        const bb = arrayToBox(nodeBoundingData, boxTemp);

        // Define the width, height, and depth of the bounds as a box
        const dim = [
            bb.max.x - bb.min.x,
            bb.max.y - bb.min.y,
            bb.max.z - bb.min.z
        ];
        const sa = 2 * (dim[0] * dim[1] + dim[0] * dim[2] + dim[1] * dim[2]);

        // Get the precalculated planes based for the triangles we're
        // testing here
        const filteredLists: any = [[], [], []];
        for (let i = offset, end = offset + count; i < end; i++) {

            for (let v = 0; v < 3; v++) {

                filteredLists[v].push(sahPlanes![v][i]);

            }

        }
        filteredLists.forEach(planes => planes.sort((a, b) => a.p - b.p));

        // this bounds surface area, left bound SA, left triangles, right bound SA, right triangles
        const getCost = (sa, sal, nl, sar, nr) =>
            TRAVERSAL_COST + INTERSECTION_COST * ((sal / sa) * nl + (sar / sa) * nr);

        // the cost of _not_ splitting into smaller bounds
        const noSplitCost = INTERSECTION_COST * count;

        axis = - 1;
        let bestCost = noSplitCost;
        for (let i = 0; i < 3; i++) {

            // o1 and o2 represent the _other_ two axes in the
            // the space. So if we're checking the x (0) dimension,
            // then o1 and o2 would be y and z (1 and 2)
            const o1 = (i + 1) % 3;
            const o2 = (i + 2) % 3;

            const bmin = bb.min[xyzFields[i]];
            const bmax = bb.max[xyzFields[i]];
            const planes = filteredLists[i];

            // The number of left and right triangles on either side
            // given the current split
            let nl = 0;
            let nr = count;
            for (let p = 0; p < planes.length; p++) {

                const pinfo = planes[p];

                // As the plane moves, we have to increment or decrement the
                // number of triangles on either side of the plane
                nl++;
                nr--;

                // the distance from the plane to the edge of the broader bounds
                const ldim = pinfo.p - bmin;
                const rdim = bmax - pinfo.p;

                // same for the other two dimensions
                let ldimo1 = dim[o1], rdimo1 = dim[o1];
                let ldimo2 = dim[o2], rdimo2 = dim[o2];

				/*
				// compute the other bounding planes for the box
				// if only the current triangles are considered to
				// be in the box
				// This is really slow and probably not really worth it
				const o1planes = sahPlanes[o1];
				const o2planes = sahPlanes[o2];
				let lmin = Infinity, lmax = -Infinity;
				let rmin = Infinity, rmax = -Infinity;
				planes.forEach((p, i) => {
				const tri2 = p.tri * 2;
				const inf1 = o1planes[tri2 + 0];
				const inf2 = o1planes[tri2 + 1];
				if (i <= nl) {
				lmin = Math.min(inf1.p, inf2.p, lmin);
				lmax = Math.max(inf1.p, inf2.p, lmax);
				}
				if (i >= nr) {
				rmin = Math.min(inf1.p, inf2.p, rmin);
				rmax = Math.max(inf1.p, inf2.p, rmax);
				}
				})
				ldimo1 = Math.min(lmax - lmin, ldimo1);
				rdimo1 = Math.min(rmax - rmin, rdimo1);

				planes.forEach((p, i) => {
				const tri2 = p.tri * 2;
				const inf1 = o2planes[tri2 + 0];
				const inf2 = o2planes[tri2 + 1];
				if (i <= nl) {
				lmin = Math.min(inf1.p, inf2.p, lmin);
				lmax = Math.max(inf1.p, inf2.p, lmax);
				}
				if (i >= nr) {
				rmin = Math.min(inf1.p, inf2.p, rmin);
				rmax = Math.max(inf1.p, inf2.p, rmax);
				}
				})
				ldimo2 = Math.min(lmax - lmin, ldimo2);
				rdimo2 = Math.min(rmax - rmin, rdimo2);
				*/

                // surface areas and cost
                const sal = 2 * (ldimo1 * ldimo2 + ldimo1 * ldim + ldimo2 * ldim);
                const sar = 2 * (rdimo1 * rdimo2 + rdimo1 * rdim + rdimo2 * rdim);
                const cost = getCost(sa, sal, nl, sar, nr);

                if (cost < bestCost) {

                    axis = i;
                    pos = pinfo.p;
                    bestCost = cost;

                }

            }

        }

    }

    return { axis, pos };

}

// returns the average coordinate on the specified axis of the all the provided triangles
function getAverage (triangleBounds: Float32Array, offset: number, count: number, axis: number) {

    let avg = 0;
    for (let i = offset, end = offset + count; i < end; i++) {

        avg += triangleBounds[i * 6 + axis * 2];

    }

    return avg / count;

}

function computeSAHPlanes (triangleBounds: Float32Array) {

    const triCount = triangleBounds.length / 6;
    const sahPlanes: [object[], object[], object[]] = [new Array(triCount), new Array(triCount), new Array(triCount)];
    for (let tri = 0; tri < triCount; tri++) {

        for (let el = 0; el < 3; el++) {

            sahPlanes[el][tri] = { p: triangleBounds[tri * 6 + el * 2], tri };

        }

    }

    return sahPlanes;

}

// precomputes the bounding box for each triangle; required for quickly calculating tree splits.
// result is an array of size tris.length * 6 where triangle i maps to a
// [x_center, x_delta, y_center, y_delta, z_center, z_delta] tuple starting at index i * 6,
// representing the center and half-extent in each dimension of triangle i
function computeTriangleBounds (geo: Model) {

    // const verts = geo.attributes.position.array;
    // const index = geo.index.array;
    const verts = geo.getSubModel(0).subMeshData.geometricInfo!.positions as Float32Array;
    const index = geo.getSubModel(0).subMeshData.geometricInfo!.indices as Uint16Array;
    const triCount = index.length / 3;
    const triangleBounds = new Float32Array(triCount * 6);

    for (let tri = 0; tri < triCount; tri++) {

        const tri3 = tri * 3;
        const tri6 = tri * 6;
        const ai = index[tri3 + 0] * 3;
        const bi = index[tri3 + 1] * 3;
        const ci = index[tri3 + 2] * 3;

        for (let el = 0; el < 3; el++) {

            const a = verts[ai + el];
            const b = verts[bi + el];
            const c = verts[ci + el];

            let min = a;
            if (b < min) min = b;
            if (c < min) min = c;

            let max = a;
            if (b > max) max = b;
            if (c > max) max = c;

            const halfExtents = (max - min) / 2;
            const el2 = el * 2;
            triangleBounds[tri6 + el2 + 0] = min + halfExtents;
            triangleBounds[tri6 + el2 + 1] = halfExtents;

        }

    }

    return triangleBounds;

}

export function buildTree (geo: Model, options: IBVHBuildOptions) {

    // either recursively splits the given node, creating left and right subtrees for it, or makes it a leaf node,
    // recording the offset and count of its triangles and writing them into the reordered geometry index.
    function splitNode (node: MeshBVHNode, offset: number, count: number, centroidBoundingData: any = null, depth = 0) {

        if (!reachedMaxDepth && depth >= maxDepth) {
            reachedMaxDepth = true;
            if (verbose) {
                console.warn(`MeshBVH: Max depth of ${maxDepth} reached when generating BVH. Consider increasing maxDepth.`);
            }

        }

        // early out if we've met our capacity
        if (count <= maxLeafTris || depth >= maxDepth) {

            node.offset = offset;
            node.count = count;
            return node;

        }

        // Find where to split the volume
        const split = getOptimalSplit(node.boundingData, centroidBoundingData, triangleBounds, sahPlanes, offset, count, strategy);
        if (split.axis === - 1) {

            node.offset = offset;
            node.count = count;
            return node;

        }

        const splitOffset = partition(indexArray, triangleBounds, sahPlanes, offset, count, split);

        // create the two new child nodes
        if (splitOffset === offset || splitOffset === offset + count) {

            node.offset = offset;
            node.count = count;

        } else {

            node.splitAxis = split.axis;

            // create the left child and compute its bounding box
            const left = new MeshBVHNode();
            const lstart = offset;
            const lcount = splitOffset - offset;
            node.left = left;
            left.boundingData = new Float32Array(6);

            if (lazyGeneration) {

                getBounds(triangleBounds, lstart, lcount, left.boundingData);
                left.continueGeneration = function () {

                    delete this.continueGeneration;
                    getCentroidBounds(triangleBounds, lstart, lcount, cacheCentroidBoundingData);
                    splitNode(left, lstart, lcount, cacheCentroidBoundingData, depth + 1);

                };

            } else {

                getBounds(triangleBounds, lstart, lcount, left.boundingData, cacheCentroidBoundingData);
                splitNode(left, lstart, lcount, cacheCentroidBoundingData, depth + 1);

            }

            // repeat for right
            const right = new MeshBVHNode();
            const rstart = splitOffset;
            const rcount = count - lcount;
            node.right = right;
            right.boundingData = new Float32Array(6);

            if (lazyGeneration) {

                getBounds(triangleBounds, rstart, rcount, right.boundingData);
                right.continueGeneration = function () {

                    delete this.continueGeneration;
                    getCentroidBounds(triangleBounds, rstart, rcount, cacheCentroidBoundingData);
                    splitNode(right, rstart, rcount, cacheCentroidBoundingData, depth + 1);

                };

            } else {

                getBounds(triangleBounds, rstart, rcount, right.boundingData, cacheCentroidBoundingData);
                splitNode(right, rstart, rcount, cacheCentroidBoundingData, depth + 1);

            }

        }

        return node;

    }

    ensureIndex(geo);

    const cacheCentroidBoundingData = new Float32Array(6);
    const triangleBounds = computeTriangleBounds(geo);
    const sahPlanes = options.strategy === SAH ? computeSAHPlanes(triangleBounds) : null;
    // const indexArray = geo.index.array;
    const indexArray = geo.getSubModel(0).subMeshData.geometricInfo!.indices as Uint16Array;
    const maxDepth = options.maxDepth;
    const verbose = options.verbose;
    const maxLeafTris = options.maxLeafTris;
    const strategy = options.strategy;
    const lazyGeneration = options.lazyGeneration;
    let reachedMaxDepth = false;

    const roots: MeshBVHNode[] = [];
    const ranges = getRootIndexRanges(geo);

    if (ranges.length === 1) {

        const root = new MeshBVHNode();
        const range = ranges[0];

        if (geo.boundingBox != null) {

            root.boundingData = boxToArray(geo.boundingBox);
            getCentroidBounds(triangleBounds, range.offset, range.count, cacheCentroidBoundingData);

        } else {

            root.boundingData = new Float32Array(6);
            getBounds(triangleBounds, range.offset, range.count, root.boundingData, cacheCentroidBoundingData);

        }

        splitNode(root, range.offset, range.count, cacheCentroidBoundingData);
        roots.push(root);

    } else {

        for (let range of ranges) {

            const root = new MeshBVHNode();
            root.boundingData = new Float32Array(6);
            getBounds(triangleBounds, range.offset, range.count, root.boundingData, cacheCentroidBoundingData);

            splitNode(root, range.offset, range.count, cacheCentroidBoundingData);
            roots.push(root);

        }

    }

    // if the geometry doesn't have a bounding box, then let's politely populate it using
    // the work we did to determine the BVH root bounds
    if (geo.boundingBox == null) {

        const rootBox = new aabb();
        geo.boundingBox = new aabb();

        for (let root of roots) {

            geo.boundingBox.union(arrayToBox(root.boundingData, rootBox));

        }

    }

    return roots;

}
