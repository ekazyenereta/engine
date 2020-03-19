import { BULLET } from './../bullet-export';
import { Vec3, absMax } from "../../../core";
import { BulletShape } from "./bullet-shape";
import { CapsuleColliderComponent } from '../../../../exports/physics-framework';
import { cocos2BulletVec3 } from '../bullet-util';
import { btBroadphaseNativeTypes } from '../bullet-enum';
import { ICapsuleShape } from '../../spec/i-physics-shape';
import { IVec3Like } from '../../../core/math/type-define';

export class BulletCapsuleShape extends BulletShape implements ICapsuleShape {

    setHeight (v: number) {
        this.updateCapsuleProp(this.collider.radius, v, this._collider.node.worldScale);
    }

    setDirection (v: number) {
        BULLET.btCapsuleShape_setUpAxis(this.impl, v);
    }

    setRadius (v: number) {
        this.updateCapsuleProp(v, this.collider.height, this._collider.node.worldScale);
    }

    get impl () {
        return this._btShape;
    }

    get collider () {
        return this._collider as CapsuleColliderComponent;
    }

    constructor () {
        super(btBroadphaseNativeTypes.CAPSULE_SHAPE_PROXYTYPE);
        this._btShape = BULLET.btCapsuleShape_create(0.5, 1);
    }

    onLoad () {
        super.onLoad();
        this.setRadius(this.collider.radius);
    }

    updateScale () {
        super.updateScale();
        this.setRadius(this.collider.radius);
    }

    /**
     * radius \ height \ scale
     */
    updateCapsuleProp (radius: number, height: number, scale: IVec3Like) {
        const ws = scale;
        const upAxis = this.collider.direction;
        const isd = BULLET.btConvexInternalShape_getImplicitShapeDimensions(this.impl);
        if (upAxis == 1) {
            const wh = height * Math.abs(ws.y);
            const wr = radius * absMax(ws.x, ws.z);
            const halfH = (wh - wr * 2) / 2;
            BULLET.btVector3_setValue(isd, wr, halfH, wr);
        } else if (upAxis == 0) {
            const wh = height * Math.abs(ws.x);
            const wr = radius * absMax(ws.y, ws.z);
            const halfH = (wh - wr * 2) / 2;
            BULLET.btVector3_setValue(halfH, wr, wr);
        } else {
            const wh = height * Math.abs(ws.z);
            const wr = radius * absMax(ws.x, ws.y);
            const halfH = (wh - wr * 2) / 2;
            BULLET.btVector3_setValue(wr, wr, halfH);
        }
        cocos2BulletVec3(this.scale, Vec3.ONE);
        BULLET.btCollisionShape_setLocalScaling(this.impl, this.scale);
    }
}
