import { BULLET } from './../bullet-export';
import { BulletShape } from "./bullet-shape";
import { Vec3 } from "../../../core";
import { BoxColliderComponent } from '../../../../exports/physics-framework';
import { cocos2BulletVec3 } from '../bullet-util';
import { btBroadphaseNativeTypes } from '../bullet-enum';
import { IBoxShape } from '../../spec/i-physics-shape';
import { IVec3Like } from '../../../core/math/type-define';

const v3_0 = new Vec3();

export class BulletBoxShape extends BulletShape implements IBoxShape {

    setSize (size: IVec3Like) {
        Vec3.copy(v3_0, size);
        Vec3.multiply(v3_0, v3_0, this._collider.node.worldScale);
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
        return this._collider as BoxColliderComponent;
    }

    readonly _halfExt: number;

    constructor () {
        super(btBroadphaseNativeTypes.BOX_SHAPE_PROXYTYPE);
        this._halfExt = BULLET.btVector3_create(0.5, 0.5, 0.5);
        this._btShape = BULLET.btBoxShape_create(this._halfExt);
    }

    onLoad () {
        super.onLoad();
        this.setSize(this.collider.size);
    }

    onDestroy () {
        super.onDestroy();
        // Ammo.destroy(this._halfExt);
        (this._halfExt as any) = null;
    }

    updateScale () {
        super.updateScale();
        this.setSize(this.collider.size);
    }

}
