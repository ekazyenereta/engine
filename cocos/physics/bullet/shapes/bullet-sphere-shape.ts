import { BULLET } from './../bullet-export';
import { Vec3 } from "../../../core";
import { BulletShape } from "./bullet-shape";
import { SphereColliderComponent } from '../../../../exports/physics-framework';
import { cocos2BulletVec3 } from '../bullet-util';
import { btBroadphaseNativeTypes } from '../bullet-enum';
import { ISphereShape } from '../../spec/i-physics-shape';

const v3_0 = new Vec3();

export class BulletSphereShape extends BulletShape implements ISphereShape {

    setRadius (radius: number) {
        const ws = this._collider.node.worldScale;
        const max_sp = Math.abs(Math.max(Math.max(ws.x, ws.y), ws.z));
        v3_0.set(radius, radius, radius);
        v3_0.multiplyScalar(max_sp * 2);
        cocos2BulletVec3(this.scale, v3_0);
        BULLET.btCollisionShape_setLocalScaling(this._btShape, this.scale);
        if (this._btCompound) {
            BULLET.btCompoundShape_updateChildTransform(this._btCompound, this._index, this.transform, true);
        }
    }

    get impl () {
        return this._btShape;
    }

    get collider () {
        return this._collider as SphereColliderComponent;
    }

    constructor () {
        super(btBroadphaseNativeTypes.SPHERE_SHAPE_PROXYTYPE);
        this._btShape = BULLET.btSphereShape_create(0.5);
    }

    onLoad () {
        super.onLoad();
        this.setRadius(this.collider.radius);
    }

    updateScale () {
        super.updateScale();
        this.setRadius(this.collider.radius);
    }
}
