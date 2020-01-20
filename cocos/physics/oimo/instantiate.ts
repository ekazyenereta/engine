import { instantiate } from '../framework/Physics-selector';
import { OimoRigidBody } from './oimo-rigid-body';
import { OimoWorld } from './oimo-world';
import { OimoBoxShape } from './shapes/oimo-box-shape';
import { OimoSphereShape } from './shapes/oimo-sphere-shape';

if (CC_PHYSICS_OIMO) {
    instantiate(
        OimoBoxShape,
        OimoSphereShape,
        OimoRigidBody,
        OimoWorld,
    );
}
