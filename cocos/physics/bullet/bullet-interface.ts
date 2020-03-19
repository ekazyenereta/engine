import { BulletShape } from './shapes/bullet-shape';

export interface IAmmoBodyStruct {
    readonly id: number;
    readonly body: number;
    readonly shape: number;
    readonly worldQuat: number;
    readonly localInertia: number;
    readonly rbInfo: number;
    readonly startTransform: number;
    readonly motionState: number;
    readonly wrappedShapes: BulletShape[];
}

export interface IAmmoGhostStruct {
    readonly id: number;
    readonly ghost: number;
    readonly shape: number;
    readonly worldQuat: number;
    readonly wrappedShapes: BulletShape[];
}