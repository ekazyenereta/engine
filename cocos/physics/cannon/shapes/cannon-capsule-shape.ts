import CANNON from '@cocos/cannon';
import { Vec3, absMaxComponent } from '../../../core/math';
import { commitShapeUpdates } from '../cannon-util';
import { CannonShape } from './cannon-shape';
import { ICapsuleShape } from '../../spec/i-physics-shape';
import { CapsuleColliderComponent } from '../../../../exports/physics-framework';
import { ECapsuleDirection } from '../../framework/components/collider/capsule-collider-component';
import { IVec3Like } from '../../../core/math/type-define';

export class CannonCapsuleShape extends CannonShape implements ICapsuleShape {

    public get capsuleCollider () {
        return this.collider as CapsuleColliderComponent;
    }

    public get cylinder () {
        return this._shape as CANNON.Cylinder;
    }

    public get sphereTop () {
        return this._sphereTop as CANNON.Sphere;
    }

    public get sphereBottom () {
        return this._sphereBottom as CANNON.Sphere;
    }

    protected _sphereTop: CANNON.Shape;
    protected _sphereBottom: CANNON.Shape;

    readonly offsetTop: CANNON.Vec3;
    readonly offsetBottom: CANNON.Vec3;

    constructor (radius: number, height: number, direction = ECapsuleDirection.Y_AXIS) {
        super();
        this._shape = new CANNON.Cylinder(radius, radius, height, 16);
        this._sphereTop = new CANNON.Sphere(radius);
        this._sphereBottom = new CANNON.Sphere(radius);

        this.offsetTop = new CANNON.Vec3();
        this.offsetBottom = new CANNON.Vec3();

        this._isCompound = true;
        this._compoundStruct = {
            shapes: [this._shape, this._sphereTop, this._sphereBottom],
            offsets: [this.offset, this.offsetTop, this.offsetBottom],
            orients: [this.orient, this.orient, this.orient]
        }
    }

    set radius (v: number) {
        const ws = this.collider.node.worldScale;
        const max = absMaxComponent(ws);
        const wr = v * Math.abs(max);
        if (wr == this.sphereTop.radius) return;

        this.sphereTop.radius = wr;
        this.sphereTop.updateBoundingSphereRadius();
        this.sphereBottom.radius = wr;
        this.sphereBottom.updateBoundingSphereRadius();

        const doubleWR = wr * 2;
        let wh = this.capsuleCollider.height * Math.abs(ws.y);
        let offset = wh - doubleWR;
        if (offset < 0) offset = 0;
        reConstructCylinder(this.cylinder, wr, wr, offset, 16);

        if (this._index != -1) {
            commitShapeUpdates(this._body);
        }
    }

    set height (v: number) {
        const ws = this._collider.node.worldScale;
        const max = absMaxComponent(ws);
        const wr = this.capsuleCollider.radius * Math.abs(max);

        const doubleWR = wr * 2;
        let wh = v * Math.abs(ws.y);
        let offset = wh - doubleWR;
        if (offset < 0) offset = 0;
        reConstructCylinder(this.cylinder, wr, wr, offset, 20);

        if (this._index != -1) {
            commitShapeUpdates(this._body);
        }
    }

    /** TODO:IMPL */
    set direction (v: ECapsuleDirection) {
        // this.resetCapsule();
    }

    onLoad () {
        super.onLoad();
        this.radius = this.capsuleCollider.radius;
    }

    setScale (scale: IVec3Like): void {
        super.setScale(scale);
        this.radius = this.capsuleCollider.radius;
    }

    setCompoundCenter (center: IVec3Like) {
        const lpos = this.offset as IVec3Like;
        const ws = this._collider.node.worldScale;
        Vec3.copy(lpos, center);
        Vec3.multiply(lpos, lpos, ws);

        const max = absMaxComponent(ws);
        const wr = this.capsuleCollider.radius * Math.abs(max);
        const doubleWR = wr * 2;
        let wh = this.capsuleCollider.height * Math.abs(ws.y)
        let halfOffset = (wh - doubleWR) / 2;
        if (halfOffset < 0) halfOffset = 0;
        this.offsetTop.set(lpos.x, lpos.y + halfOffset, lpos.z);
        this.offsetBottom.set(lpos.x, lpos.y - halfOffset, lpos.z);

        if (this._index >= 0) {
            commitShapeUpdates(this._body);
        }
    }
}


function reConstructCylinder (out: CANNON.Cylinder, radiusTop: number, radiusBottom: number, height: number, numSegments = 16) {
    const N = numSegments;

    const verts: CANNON.Vec3[] = out.vertices;
    const axes: CANNON.Vec3[] = out.uniqueAxes;

    const faces: number[][] = [];
    const cos = Math.cos;
    const sin = Math.sin;

    // let ai = 0;
    // let vi = 0;
    // let tmpVec3: CANNON.Vec3;
    // // First bottom point
    // if (verts[vi] == null) {
    //     tmpVec3 = verts[vi] = new CANNON.Vec3();
    // } else {
    //     tmpVec3 = verts[vi];
    // }
    // tmpVec3.set(radiusBottom * cos(0), radiusBottom * sin(0), -height * 0.5);
    // vi++;

    // bottomface.push(0);

    // // First top point        
    // if (verts[vi] == null) {
    //     tmpVec3 = verts[vi] = new CANNON.Vec3();
    // } else {
    //     tmpVec3 = verts[vi];
    // }
    // tmpVec3.set(radiusTop * cos(0), radiusTop * sin(0), height * 0.5);
    // vi++;

    // topface.push(1);

    // for (var i = 0; i < N; i++) {
    //     var theta = 2 * Math.PI / N * (i + 1);
    //     var thetaN = 2 * Math.PI / N * (i + 0.5);
    //     if (i < N - 1) {
    //         // Bottom
    //         if (verts[vi] == null) {
    //             tmpVec3 = verts[vi] = new CANNON.Vec3();
    //         } else {
    //             tmpVec3 = verts[vi];
    //         }
    //         tmpVec3.set(radiusBottom * cos(theta), radiusBottom * sin(theta), -height * 0.5);
    //         vi++;

    //         bottomface.push(2 * i + 2);

    //         // Top
    //         if (verts[vi] == null) {
    //             tmpVec3 = verts[vi] = new CANNON.Vec3();
    //         } else {
    //             tmpVec3 = verts[vi];
    //         }
    //         tmpVec3.set(radiusTop * cos(theta), radiusTop * sin(theta), height * 0.5);
    //         vi++;

    //         topface.push(2 * i + 3);

    //         // Face
    //         faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
    //     } else {
    //         faces.push([0, 1, 2 * i + 1, 2 * i]); // Connect
    //     }

    //     // Axis: we can cut off half of them if we have even number of segments
    //     if (N % 2 === 1 || i < N / 2) {
    //         if (axes[ai] == null) {
    //             tmpVec3 = axes[ai] = new CANNON.Vec3();
    //         } else {
    //             tmpVec3 = axes[ai];
    //         }
    //         tmpVec3.set(cos(thetaN), sin(thetaN), 0);
    //         ai++;
    //     }
    // }
    // faces.push(topface);

    // if (axes[ai] == null) {
    //     tmpVec3 = axes[ai] = new CANNON.Vec3();
    // } else {
    //     tmpVec3 = axes[ai];
    // }
    // tmpVec3.set(0, 0, 1);
    // ai++;

    // // Reorder bottom face
    // var temp: number[] = [];
    // for (var i = 0; i < bottomface.length; i++) {
    //     temp.push(bottomface[bottomface.length - i - 1]);
    // }
    // faces.push(temp);

    var halfH = height / 2;
    var tf = [0];
    var bf = [1];
    var vi = 0;
    var ai = 0;
    var tmpVec3: CANNON.Vec3;
    var theta = Math.PI * 2 / N;
    for (var i = 0; i < N; i++) {
        if (verts[vi] == null) { tmpVec3 = verts[vi] = new CANNON.Vec3(); } else { tmpVec3 = verts[vi]; }
        tmpVec3.set(radiusTop * Math.cos(theta * i), halfH, radiusTop * Math.sin(theta * i));
        vi++;

        if (verts[vi] == null) { tmpVec3 = verts[vi] = new CANNON.Vec3(); } else { tmpVec3 = verts[vi]; }
        tmpVec3.set(radiusBottom * Math.cos(theta * i), -halfH, radiusBottom * Math.sin(theta * i));
        vi++;

        if (i < N - 1) {
            faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
            tf.push(2 * i + 2);
            bf.push(2 * i + 3);
        } else {
            faces.push([0, 1, 2 * i + 1, 2 * i]);
        }

        if (N % 2 === 1 || i < N / 2) {
            if (axes[ai] == null) { tmpVec3 = axes[ai] = new CANNON.Vec3(); } else { tmpVec3 = axes[ai]; }
            tmpVec3.set(cos(theta * (i + 0.5)), 0, sin(theta * (i + 0.5)));
            ai++;
        }
    }
    faces.push(bf);
    var temp: number[] = [];
    for (var i = 0; i < tf.length; i++) {
        temp.push(tf[tf.length - i - 1]);
    }
    faces.push(temp);
    if (axes[ai] == null) { tmpVec3 = axes[ai] = new CANNON.Vec3(); } else { tmpVec3 = axes[ai]; }
    tmpVec3.set(0, 1, 0);
    ai++;

    verts.length = vi;
    axes.length = ai;
    out.faces = faces;
    out.computeNormals();
    out.worldVerticesNeedsUpdate = true;
    out.worldFaceNormalsNeedsUpdate = true;
    out.computeEdges();
    out.updateBoundingSphereRadius();
}