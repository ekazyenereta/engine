import { Quat, Vec3 } from '../../math';
import { Ambient } from './ambient';
import { Light, LightType } from './light';

const _forward = new Vec3(0, 0, -1);
const _v3 = new Vec3();
const _qt = new Quat();

export class DirectionalLight extends Light {

    protected _dir: Vec3 = new Vec3(1.0, -1.0, -1.0);
    protected _illum: number = Ambient.SUN_ILLUM;

    set direction (dir: Vec3) {
        this._dir = dir;
        Vec3.normalize(this._dir, this._dir);
    }

    get direction (): Vec3 {
        return this._dir;
    }

    // in Lux(lx)
    set illuminance (illum: number) {
        this._illum = illum;
    }

    get illuminance (): number {
        return this._illum;
    }

    constructor () {
        super();
        this._type = LightType.DIRECTIONAL;
    }

    public update () {
        if (this._node && this._node.hasChangedFlags) {
            this._dir = Vec3.transformQuat(_v3, _forward, this._node.getWorldRotation(_qt));
            Vec3.normalize(this._dir, this._dir);
        }
    }
}
