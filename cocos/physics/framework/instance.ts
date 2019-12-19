/**
 * @hidden
 */

import { Vec3 } from '../../core/math';
import { BoxShape, PhysicsWorld, RigidBody, SphereShape, CapsuleShape } from './Physics-selector';
import { IRigidBody } from '../spec/i-rigid-body';
import { IBoxShape, ISphereShape, ICapsuleShape } from '../spec/i-physics-shape';
import { IPhysicsWorld } from '../spec/i-physics-world';
import { ECapsuleDirection } from './components/collider/capsule-collider-component';

export function createPhysicsWorld (): IPhysicsWorld {
    return new PhysicsWorld() as IPhysicsWorld;
}

export function createRigidBody (): IRigidBody {
    return new RigidBody!() as IRigidBody;
}

export function createBoxShape (size: Vec3): IBoxShape {
    return new BoxShape(size) as IBoxShape;
}

export function createSphereShape (radius: number): ISphereShape {
    return new SphereShape(radius) as ISphereShape;
}

export function createCapsuleShape (radius = 0.5, height = 2, dir = ECapsuleDirection.Y_AXIS): ICapsuleShape {
    return new CapsuleShape(radius, height, dir) as ICapsuleShape;
}
