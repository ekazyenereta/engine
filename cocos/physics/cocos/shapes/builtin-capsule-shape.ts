
import { BuiltinShape } from './builtin-shape';
import { ICapsuleShape } from '../../spec/i-physics-shape';
import { ECapsuleDirection, CapsuleColliderComponent } from '../../framework/components/collider/capsule-collider-component';
import { Vec3, Mat4, EPSILON } from '../../../core';
import { IVec3Like, IQuatLike } from '../../../core/math/type-define';
import { IBuiltinShape } from '../builtin-interface';
import { absMaxComponent } from '../../framework/util';
import { intersect, enums, aabb, obb, sphere } from '../../../core/geom-utils';

class capsule {
    protected _type: number;
    radius: number;
    readonly ellipseCenter0: Vec3;
    readonly ellipseCenter1: Vec3;

    readonly center: Vec3;

    transform (m: Mat4, pos: IVec3Like, rot: IQuatLike, scale: IVec3Like, out: IBuiltinShape): any {

    }

    constructor (radius: number, halfHeight: number, axis = ECapsuleDirection.Y_AXIS) {
        this._type = enums.SHAPE_CAPSULE;
        this.radius = radius;
        this.center = new Vec3();
        this.ellipseCenter0 = new Vec3(0, halfHeight, 0);
        this.ellipseCenter1 = new Vec3(0, -halfHeight, 0);
    }

    resetAxis (axis: ECapsuleDirection) {
        const halfHeight = Math.abs(absMaxComponent(this.ellipseCenter0));
        switch (axis) {
            case ECapsuleDirection.X_AXIS:
                this.ellipseCenter0.set(halfHeight, 0, 0);
                this.ellipseCenter1.set(-halfHeight, 0, 0);
                break;
            case ECapsuleDirection.Y_AXIS:
                this.ellipseCenter0.set(0, halfHeight, 0);
                this.ellipseCenter1.set(0, -halfHeight, 0);
                break;
            case ECapsuleDirection.Z_AXIS:
                this.ellipseCenter0.set(0, 0, halfHeight);
                this.ellipseCenter1.set(0, 0, -halfHeight);
                break;
        }
    }
}

const aabb_capsule = function (aabb: aabb, capsule: capsule) {

}

const v3_0 = new Vec3();
const v3_1 = new Vec3();
const sphere_capsule = function (sphere: sphere, capsule: capsule) {
    const r = sphere.radius + capsule.radius;
    const squaredR = r * r;
    const h = Vec3.squaredDistance(capsule.ellipseCenter0, capsule.ellipseCenter1);
    if (h == 0) {
        return Vec3.squaredDistance(sphere.center, capsule.center) < squaredR;
    } else {
        Vec3.subtract(v3_0, sphere.center, capsule.ellipseCenter0);
        Vec3.subtract(v3_1, capsule.ellipseCenter1, capsule.ellipseCenter0);
        const t = Vec3.dot(v3_0, v3_1) / h;
        if (t < 0) {
            return Vec3.squaredDistance(sphere.center, capsule.ellipseCenter0) < squaredR;
        } else if (t > 1) {
            return Vec3.squaredDistance(sphere.center, capsule.ellipseCenter1) < squaredR;
        } else {
            Vec3.scaleAndAdd(v3_0, capsule.ellipseCenter0, v3_1, t);
            return Vec3.squaredDistance(sphere.center, v3_0) < squaredR;
        }
    }
}

const v3_a1 = new Vec3();
const v3_a2 = new Vec3();
const v3_a3 = new Vec3();
const v3_arr8 = new Array<Vec3>(8);
for (let i = 0; i < 8; i++) {
    v3_arr8[i] = new Vec3();
}
const obb_capsule = function (obb: obb, capsule: capsule) {
    const squaredR = capsule.radius * capsule.radius;
    const h = Vec3.squaredDistance(capsule.ellipseCenter0, capsule.ellipseCenter1);
    v3_a1.x = obb.orientation.m00;
    v3_a1.y = obb.orientation.m01;
    v3_a1.z = obb.orientation.m02;
    v3_a2.x = obb.orientation.m03;
    v3_a2.y = obb.orientation.m04;
    v3_a2.z = obb.orientation.m05;
    v3_a3.x = obb.orientation.m06;
    v3_a3.y = obb.orientation.m07;
    v3_a3.z = obb.orientation.m08;
    getOBBVertices(obb.center, obb.halfExtents, v3_a1, v3_a2, v3_a3, v3_arr8);
    let result = false;
    if (h == 0) {
        for (let i = 0; i < 8; i++) {
            result = Vec3.squaredDistance(v3_arr8[i], capsule.center) < squaredR;
            if (result) return result;
        }
    } else {
        for (let i = 0; i < 8; i++) {
            Vec3.subtract(v3_0, v3_arr8[i], capsule.ellipseCenter0);
            Vec3.subtract(v3_1, capsule.ellipseCenter1, capsule.ellipseCenter0);
            const t = Vec3.dot(v3_0, v3_1) / h;
            if (t < 0) {
                result = Vec3.squaredDistance(v3_arr8[i], capsule.ellipseCenter0) < squaredR;
            } else if (t > 1) {
                result = Vec3.squaredDistance(v3_arr8[i], capsule.ellipseCenter1) < squaredR;
            } else {
                Vec3.scaleAndAdd(v3_0, capsule.ellipseCenter0, v3_1, t);
                result = Vec3.squaredDistance(v3_arr8[i], v3_0) < squaredR;
            }
            if (result) return result;
        }
    }
    return result;
}

function getOBBVertices (c: Vec3, e: Vec3, a1: Vec3, a2: Vec3, a3: Vec3, out: Vec3[]) {
    Vec3.set(out[0],
        c.x + a1.x * e.x + a2.x * e.y + a3.x * e.z,
        c.y + a1.y * e.x + a2.y * e.y + a3.y * e.z,
        c.z + a1.z * e.x + a2.z * e.y + a3.z * e.z,
    );
    Vec3.set(out[1],
        c.x - a1.x * e.x + a2.x * e.y + a3.x * e.z,
        c.y - a1.y * e.x + a2.y * e.y + a3.y * e.z,
        c.z - a1.z * e.x + a2.z * e.y + a3.z * e.z,
    );
    Vec3.set(out[2],
        c.x + a1.x * e.x - a2.x * e.y + a3.x * e.z,
        c.y + a1.y * e.x - a2.y * e.y + a3.y * e.z,
        c.z + a1.z * e.x - a2.z * e.y + a3.z * e.z,
    );
    Vec3.set(out[3],
        c.x + a1.x * e.x + a2.x * e.y - a3.x * e.z,
        c.y + a1.y * e.x + a2.y * e.y - a3.y * e.z,
        c.z + a1.z * e.x + a2.z * e.y - a3.z * e.z,
    );
    Vec3.set(out[4],
        c.x - a1.x * e.x - a2.x * e.y - a3.x * e.z,
        c.y - a1.y * e.x - a2.y * e.y - a3.y * e.z,
        c.z - a1.z * e.x - a2.z * e.y - a3.z * e.z,
    );
    Vec3.set(out[5],
        c.x + a1.x * e.x - a2.x * e.y - a3.x * e.z,
        c.y + a1.y * e.x - a2.y * e.y - a3.y * e.z,
        c.z + a1.z * e.x - a2.z * e.y - a3.z * e.z,
    );
    Vec3.set(out[6],
        c.x - a1.x * e.x + a2.x * e.y - a3.x * e.z,
        c.y - a1.y * e.x + a2.y * e.y - a3.y * e.z,
        c.z - a1.z * e.x + a2.z * e.y - a3.z * e.z,
    );
    Vec3.set(out[7],
        c.x - a1.x * e.x - a2.x * e.y + a3.x * e.z,
        c.y - a1.y * e.x - a2.y * e.y + a3.y * e.z,
        c.z - a1.z * e.x - a2.z * e.y + a3.z * e.z,
    );
}

const v3_dirSAB = new Vec3();
const v3_dirA = new Vec3();
const v3_dirB = new Vec3();
const v3_closestA = new Vec3();
const v3_closestB = new Vec3();
const v3_closestA_alt = new Vec3();
const v3_closestB_alt = new Vec3();
function capsule_capsule (capsuleA: capsule, capsuleB: capsule) {
    const startA = capsuleA.ellipseCenter0;
    const startB = capsuleB.ellipseCenter0;
    const endA = capsuleA.ellipseCenter1;
    const endB = capsuleB.ellipseCenter1;

    Vec3.subtract(v3_dirSAB, startA, startB);
    Vec3.subtract(v3_dirA, startA, endA);
    Vec3.subtract(v3_dirB, startA, endB);

    const dirBDotDirAToB = Vec3.dot(v3_dirB, v3_dirSAB);
    const dirADotDirAToB = Vec3.dot(v3_dirA, v3_dirSAB);

    const sqrLenDirB = v3_dirB.lengthSqr();
    const sqrLenDirA = v3_dirA.lengthSqr();

    const dirADotDirB = Vec3.dot(v3_dirA, v3_dirB);

    const denominator = sqrLenDirA * sqrLenDirB - dirADotDirB * dirADotDirB;

    const distA = denominator < EPSILON ? 0 : (dirADotDirB * dirBDotDirAToB - sqrLenDirB * dirADotDirAToB) / denominator;
    const distB = (dirBDotDirAToB + dirADotDirB * distA) / sqrLenDirB;

    const isDistAInBounds = distA >= 0 && distA <= 1;
    const isDistBInBounds = distB >= 0 && distB <= 1;
    if (isDistAInBounds) {
        if (isDistBInBounds) {
            // The distances along both line segments are within bounds.
            Vec3.scaleAndAdd(v3_closestA, startA, v3_dirA, distA);
            Vec3.scaleAndAdd(v3_closestB, startB, v3_dirB, distB);
        } else {
            // Only the distance along the first line segment is within bounds.
            distB < 0 ? Vec3.copy(v3_closestB, startB) : Vec3.copy(v3_closestB, endB);
            pt_point_line2(v3_closestA, v3_closestB, startA, endA);
        }
    } else {
        if (isDistBInBounds) {
            // Only the distance along the second line segment is within bounds.
            distA < 0 ? Vec3.copy(v3_closestA, startA) : Vec3.copy(v3_closestA, endA);
            pt_point_line2(v3_closestB, v3_closestA, startB, endB);
        } else {
            // Neither of the distances along either line segment are within bounds.
            distA < 0 ? Vec3.copy(v3_closestA, startA) : Vec3.copy(v3_closestA, endA);
            distB < 0 ? Vec3.copy(v3_closestB, startB) : Vec3.copy(v3_closestB, endB);

            pt_point_line2(v3_closestA_alt, v3_closestB, startA, endA);
            pt_point_line2(v3_closestB_alt, v3_closestA, startB, endB);
            if (Vec3.squaredDistance(v3_closestA_alt, v3_closestB) <
                Vec3.squaredDistance(v3_closestB_alt, v3_closestA)) {
                Vec3.copy(v3_closestA, v3_closestA_alt);
            } else {
                Vec3.copy(v3_closestB, v3_closestB_alt);
            }
        }
    }
    const r = capsuleA.radius + capsuleB.radius;
    return Vec3.squaredDistance(v3_closestA, v3_closestB) < r * r;
}

function pt_point_line2 (out: Vec3, point: Vec3, start: Vec3, end: Vec3) {
    Vec3.subtract(v3_0, start, end);
    const dirSquaredLength = Vec3.lengthSqr(v3_0);

    if (dirSquaredLength == 0) {
        // The point is at the segment start.
        Vec3.copy(out, start);
    } else {
        // Calculate the projection of the point onto the line extending through the segment.
        Vec3.subtract(v3_1, point, start);
        const t = Vec3.dot(v3_1, v3_0) / dirSquaredLength;

        if (t < 0) {
            // The point projects beyond the segment start.
            Vec3.copy(out, start);
        } else if (t > 1) {
            // The point projects beyond the segment end.
            Vec3.copy(out, end);
        } else {
            // The point projects between the start and end of the segment.
            Vec3.scaleAndAdd(out, start, v3_0, t);
        }
    }
}

intersect[enums.SHAPE_SPHERE | enums.SHAPE_CAPSULE] = sphere_capsule;
intersect[enums.SHAPE_AABB | enums.SHAPE_CAPSULE] = aabb_capsule;
intersect[enums.SHAPE_OBB | enums.SHAPE_CAPSULE] = obb_capsule;
intersect[enums.SHAPE_CAPSULE] = capsule_capsule;

export class BuiltinCapsuleShape extends BuiltinShape implements ICapsuleShape {
    set radius (v: number) {
        // this.localCapsule.radius = v;
        // const s = absMaxComponent(this.collider.node.worldScale);
        // this.worldCapsule.radius = this.localCapsule.radius * Math.abs(s);
    }

    set height (v: number) {
    }

    set direction (v: ECapsuleDirection) {
    }

    get localCapsule () {
        return this._localShape as capsule;
    }

    get worldCapsule () {
        return this._worldShape as capsule;
    }

    get capsuleCollider () {
        return this.collider as CapsuleColliderComponent;
    }

    constructor (radius: number, height: number, direction = ECapsuleDirection.Y_AXIS) {
        super();
        const halfHeight = (height - radius * 2) / 2;
        const h = halfHeight < 0 ? 0 : halfHeight;
        this._localShape = new capsule(radius, h, direction);
        this._worldShape = new capsule(radius, h, direction);
    }

    onLoad () {
        super.onLoad();
        this.radius = this.capsuleCollider.radius;
    }
}