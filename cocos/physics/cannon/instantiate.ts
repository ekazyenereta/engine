
import { PHYSICS_CANNON } from 'internal:constants';
import { instantiate } from '../framework/physics-selector';
import { CannonRigidBody } from './cannon-rigid-body';
import { CannonWorld } from './cannon-world';
import { CannonBoxShape } from './shapes/cannon-box-shape';
import { CannonSphereShape } from './shapes/cannon-sphere-shape';
import { CannonTrimeshShape } from './shapes/cannon-trimesh-shape';
import { CannonCyliderShape } from './shapes/cannon-cylinder-shape';
import { CannonConeShape } from './shapes/cannon-cone-shape';
import { CannonTerrianShape } from './shapes/cannon-terrian-shape';
import { CannonSimpleShape } from './shapes/cannon-simple-shape';


if (PHYSICS_CANNON) {
    instantiate({
        box: CannonBoxShape,
        sphere: CannonSphereShape,
        body: CannonRigidBody,
        world: CannonWorld,
        trimesh: CannonTrimeshShape,
        cylinder: CannonCyliderShape,
        cone: CannonConeShape,
        terrian: CannonTerrianShape,
        simple: CannonSimpleShape,
    });
}
