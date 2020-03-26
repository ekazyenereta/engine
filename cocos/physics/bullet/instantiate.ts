import { instantiate } from '../framework/physics-selector';
import { BulletRigidBody } from './bullet-rigid-body';
import { BulletWorld } from '../bullet/bullet-world';
import { BulletBoxShape } from '../bullet/shapes/bullet-box-shape';
import { BulletSphereShape } from '../bullet/shapes/bullet-sphere-shape';
import { BulletCapsuleShape } from '../bullet/shapes/bullet-capsule-shape';
import { BulletCylinderShape } from '../bullet/shapes/bullet-cylinder-shape';
import { BulletBvhTriangleMeshShape } from '../bullet/shapes/bullet-bvh-triangle-mesh-shape';
import { PHYSICS_AMMO, PHYSICS_BUILTIN, PHYSICS_CANNON } from 'internal:constants';

if (!(PHYSICS_AMMO || PHYSICS_BUILTIN || PHYSICS_CANNON)) {
    instantiate({
        box: BulletBoxShape,
        sphere: BulletSphereShape,
        body: BulletRigidBody,
        world: BulletWorld,
        capsule: BulletCapsuleShape,
        trimesh: BulletBvhTriangleMeshShape,
        cylinder: BulletCylinderShape
    });
}
