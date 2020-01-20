import * as OIMO from '@cocos/oimo';
import { Vec3, absMaxComponent } from '../../../core/math';
import { maxComponent } from '../../framework/util';
import { commitShapeUpdates } from '../oimo-util';
import { OimoShape } from './oimo-shape';
import { ISphereShape } from '../../spec/i-physics-shape';
import { SphereColliderComponent } from '../../../../exports/physics-framework';

export class OimoSphereShape extends OimoShape implements ISphereShape {

    get sphereCollider () {
        return this.collider as SphereColliderComponent;
    }

    get sphere () {
        return this._shape as OIMO.Sphere;
    }

    get radius () {
        return this._radius;
    }

    set radius (v: number) {
        const max = absMaxComponent(this.collider.node.worldScale);
        this.sphere.radius = v * Math.abs(max);
        if (this._index != -1) {
            this._shape.updateProxy();
        }
    }

    private _radius: number;

    constructor (radius: number) {
        super();
        this._radius = radius;
        this._shape = new OIMO.Sphere({
            relativePosition: this._offset,
            relativeRotation: this._orient,
            friction: 0.2,
            restitution: 0.2,
            density: 1,
            belongsTo: 1,
            collidesWith: -1
        }, this._radius);
    }

    onLoad () {
        super.onLoad();
        this.radius = this.sphereCollider.radius;
    }

    setScale (scale: Vec3): void {
        super.setScale(scale);
        this.radius = this.sphereCollider.radius;
    }

}
