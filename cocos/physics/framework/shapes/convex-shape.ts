/**
 * 物理模块
 * @category physics
 */

import { ccclass, property } from '../../../core/data/class-decorator';
import { EAxisDirection, EConvexShapeType } from '../physics-enum';
import { Vec3 } from '../../../core/math';

@ccclass("cc.ConvexShape")
export class ConvexShape {
    @property({
        type: EConvexShapeType,
        displayOrder: -1,
    })
    get type () {
        return this._type;
    }

    set type (v) {
        this._type = v;
    }

    @property({
        visible: function (this: ConvexShape) {
            return this.type == EConvexShapeType.CAPSULE || this.type == EConvexShapeType.CYLINDER || this.type == EConvexShapeType.SPHERE;
        }
    })
    get radius () {
        return this._data.x;
    }

    set radius (v) {
        this._data.x = v;
    }

    @property({
        visible: function (this: ConvexShape) {
            return this.type == EConvexShapeType.CAPSULE;
        }
    })
    get cylinderHeight () {
        return this._data.y;
    }

    set cylinderHeight (v) {
        this._data.y = v;
    }

    @property({
        visible: function (this: ConvexShape) {
            return this.type == EConvexShapeType.CYLINDER;
        }
    })
    get height () {
        return this._data.y;
    }

    set height (v) {
        this._data.y = v;
    }

    @property({
        type: EAxisDirection,
        visible: function (this: ConvexShape) {
            return this.type == EConvexShapeType.CYLINDER || this.type == EConvexShapeType.CAPSULE;
        }
    })
    get direction (): EAxisDirection {
        return this._data.z;
    }

    set direction (v) {
        v = Math.floor(v);
        if (v < EAxisDirection.X_AXIS || v > EAxisDirection.Z_AXIS) return;
        this._data.z = Math.floor(v);
    }

    @property({
        visible: function (this: ConvexShape) {
            return this.type == EConvexShapeType.BOX;
        }
    })
    get size () {
        return this._data;
    }

    set size (v) {
        Vec3.copy(this._data, v);
    }

    @property
    private _type = EConvexShapeType.CAPSULE;

    @property
    private _data = new Vec3(0.5, 1, 1);
}
