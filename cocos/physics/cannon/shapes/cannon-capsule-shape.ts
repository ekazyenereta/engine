import CANNON from '@cocos/cannon';
import { Vec3 } from '../../../core/math';
import { commitShapeUpdates } from '../cannon-util';
import { CannonShape } from './cannon-shape';
import { ICapsuleShape } from '../../spec/i-physics-shape';
import { CapsuleColliderComponent, ColliderComponent } from '../../../../exports/physics-framework';
import { ECapsuleDirection } from '../../framework/components/collider/capsule-collider-component';
import { maxComponent } from '../../framework/util';
import { capsule } from '../../../core/primitive';

export class CannonCapsuleShape extends CannonShape implements ICapsuleShape {

    public get capsuleCollider () {
        return this.collider as CapsuleColliderComponent;
    }

    public get capsule () {
        return this._shape as CANNON.ConvexPolyhedron;
    }

    constructor (radius: number, height: number, direction = ECapsuleDirection.Y_AXIS) {
        super();
        this._shape = new CANNON.ConvexPolyhedron();
    }

    set radius (v: number) {
        this.resetCapsule();
    }

    set height (v: number) {
        this.resetCapsule();
    }

    /** TODO:IMPL */
    set direction (v: ECapsuleDirection) {
        // this.resetCapsule();
    }

    onLoad () {
        super.onLoad();
        this.resetCapsule();
    }

    setScale (scale: Vec3): void {
        super.setScale(scale);
        this.resetCapsule();
    }
    /** TODO:FIX */
    private generateCapsule (out: CANNON.ConvexPolyhedron, r: number, h: number, dir = ECapsuleDirection.Y_AXIS) {
        const radiusTop = r;
        const radiusBottom = r;
        const height = h;

        const torsoHeight = height - radiusTop - radiusBottom;
        const sides = 32;
        const heightSegments = 32;
        const bottomProp = radiusBottom / height;
        const torProp = torsoHeight / height;
        const topProp = radiusTop / height;
        const bottomSegments = Math.floor(heightSegments * bottomProp);
        const topSegments = Math.floor(heightSegments * topProp);
        const torSegments = Math.floor(heightSegments * torProp);
        const topOffset = torsoHeight + radiusBottom - height / 2;
        const torOffset = radiusBottom - height / 2;
        const bottomOffset = radiusBottom - height / 2;

        const arc = 2.0 * Math.PI;

        // calculate vertex count
        const positions = out.vertices;
        const indices = out.faces;

        let index = 0;
        let faceIndex = 0;
        const indexArray: number[][] = [];

        for (let lat = 0; lat <= bottomSegments; ++lat) {
            const theta = lat * Math.PI / bottomSegments / 2;
            const sinTheta = Math.sin(theta);
            const cosTheta = -Math.cos(theta);

            for (let lon = 0; lon <= sides; ++lon) {
                const phi = lon * 2 * Math.PI / sides - Math.PI / 2.0;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = sinPhi * sinTheta;
                const y = cosTheta;
                const z = cosPhi * sinTheta;

                if (positions[index] == null) {
                    positions[index] = new CANNON.Vec3();
                }
                positions[index].x = x * radiusBottom;
                positions[index].y = y * radiusBottom + bottomOffset;
                positions[index].z = z * radiusBottom;

                if ((lat < bottomSegments) && (lon < sides)) {
                    const seg1 = sides + 1;
                    const a = seg1 * lat + lon;
                    const b = seg1 * (lat + 1) + lon;
                    const c = seg1 * (lat + 1) + lon + 1;
                    const d = seg1 * lat + lon + 1;

                    const i0 = Math.floor(a / 3) + a % 3;
                    const i1 = Math.floor(b / 3) + b % 3;
                    const i2 = Math.floor(c / 3) + c % 3;
                    const i3 = Math.floor(d / 3) + d % 3;
                    indices[faceIndex++] = [i0, i3, i1];
                    indices[faceIndex++] = [i3, i2, i1];
                }

                ++index;
            }
        }
        // generate positions
        for (let y = 0; y <= torSegments; y++) {

            const indexRow: number[] = [];
            const lat = y / torSegments;
            const radius = lat * (radiusTop - radiusBottom) + radiusBottom;

            for (let x = 0; x <= sides; ++x) {
                const u = x / sides;
                const v = lat * torProp + bottomProp;
                const theta = u * arc - (arc / 4);

                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                // vertex
                if (positions[index] == null) {
                    positions[index] = new CANNON.Vec3();
                }
                positions[index].x = radius * sinTheta;
                positions[index].y = lat * torsoHeight + torOffset;
                positions[index].z = radius * cosTheta;

                // save index of vertex in respective row
                indexRow.push(index);

                // increase index
                ++index;
            }

            // now save positions of the row in our index array
            indexArray.push(indexRow);
        }

        // generate indices
        for (let y = 0; y < torSegments; ++y) {
            for (let x = 0; x < sides; ++x) {
                // we use the index array to access the correct indices
                const i1 = indexArray[y][x];
                const i2 = indexArray[y + 1][x];
                const i3 = indexArray[y + 1][x + 1];
                const i4 = indexArray[y][x + 1];

                const a = Math.floor(i1 / 3) + i1 % 3;
                const b = Math.floor(i2 / 3) + i2 % 3;
                const c = Math.floor(i3 / 3) + i3 % 3;
                const d = Math.floor(i4 / 3) + i4 % 3;
                indices[faceIndex++] = [a, d, b];
                indices[faceIndex++] = [d, c, b];
            }
        }
        for (let lat = 0; lat <= topSegments; ++lat) {
            const theta = lat * Math.PI / topSegments / 2 + Math.PI / 2;
            const sinTheta = Math.sin(theta);
            const cosTheta = -Math.cos(theta);

            for (let lon = 0; lon <= sides; ++lon) {
                const phi = lon * 2 * Math.PI / sides - Math.PI / 2.0;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = sinPhi * sinTheta;
                const y = cosTheta;
                const z = cosPhi * sinTheta;

                if (positions[index] == null) {
                    positions[index] = new CANNON.Vec3();
                }
                positions[index].x = x * radiusTop;
                positions[index].y = y * radiusTop + topOffset;
                positions[index].z = z * radiusTop;

                if ((lat < topSegments) && (lon < sides)) {
                    const seg1 = sides + 1;
                    const a = seg1 * lat + lon + indexArray[torSegments][sides] + 1;
                    const b = seg1 * (lat + 1) + lon + indexArray[torSegments][sides] + 1;
                    const c = seg1 * (lat + 1) + lon + 1 + indexArray[torSegments][sides] + 1;
                    const d = seg1 * lat + lon + 1 + indexArray[torSegments][sides] + 1;

                    const i0 = Math.floor(a / 3) + a % 3;
                    const i1 = Math.floor(b / 3) + b % 3;
                    const i2 = Math.floor(c / 3) + c % 3;
                    const i3 = Math.floor(d / 3) + d % 3;
                    indices[faceIndex++] = [i0, i3, i1];
                    indices[faceIndex++] = [i3, i2, i1];
                }
            }
        }

        positions.length = index;
        indices.length = faceIndex;
    }

    private resetCapsule () {
        const max = maxComponent(this.collider.node.worldScale);
        const radius = this.capsuleCollider.radius * Math.abs(max);
        const height = this.capsuleCollider.height;

        // this.generateCapsule(this.capsule, radius, height);
        {
            const mesh = capsule(radius, radius, height);
            const positions: number[] = mesh.positions;
            const indices: number[] = mesh.indices;

            let vi = 0;
            for (let i = 0; i < positions.length; i += 3) {
                this.capsule.vertices[vi] = new CANNON.Vec3(positions[i], positions[i + 1], positions[i + 2]);
                vi++;
            }
            this.capsule.vertices.length = vi;

            let fi = 0;
            for (let i = 0; i < indices.length; i += 3) {
                this.capsule.faces[fi] = [indices[i], indices[i + 1], indices[i + 2]];
                fi++;
            }
            this.capsule.faces.length = fi;
        }

        this.capsule.computeNormals();
        this.capsule.worldVerticesNeedsUpdate = true;
        this.capsule.computeEdges();
        this.capsule.updateBoundingSphereRadius();

        if (this._index >= 0) {
            commitShapeUpdates(this._body);
        }
    }
}
