import * as OIMO from '@cocos/oimo';
import { Vec3 } from '../../../core/math';
import { commitShapeUpdates } from '../oimo-util';
import { OimoShape } from './oimo-shape';
import { IBoxShape } from '../../spec/i-physics-shape';
import { IVec3Like } from '../../../core/math/type-define';
import { BoxColliderComponent } from '../../../../exports/physics-framework';

export class OimoBoxShape extends OimoShape implements IBoxShape {

    public get boxCollider () {
        return this.collider as BoxColliderComponent;
    }

    public get box () {
        return this._shape as OIMO.Box;
    }

    readonly halfExtent: OIMO.Vec3 = new OIMO.Vec3();
    constructor (size: Vec3) {
        super();
        Vec3.multiplyScalar(this.halfExtent, size, 0.5);
        this._shape = new OIMO.Box({
            relativePosition: this._offset,
            relativeRotation: this._orient,
            friction: 0.2,
            restitution: 0.2,
            density: 1,
            belongsTo: 1,
            collidesWith: -1
        }, this.halfExtent.x, this.halfExtent.y, this.halfExtent.z);
    }

    set size (v: IVec3Like) {
        Vec3.multiplyScalar(this.halfExtent, v, 0.5);
        const ws = this._collider.node.worldScale;
        this.box.halfWidth = this.halfExtent.x * Math.abs(ws.x);
        this.box.halfHeight = this.halfExtent.y * Math.abs(ws.y);
        this.box.halfDepth = this.halfExtent.z * Math.abs(ws.z);
        if (this._index != -1) {
            this._shape.updateProxy();
        }
    }

    onLoad () {
        super.onLoad();
        this.size = this.boxCollider.size;
    }

    setScale (scale: Vec3): void {
        super.setScale(scale);
        this.size = this.boxCollider.size;
    }
}
