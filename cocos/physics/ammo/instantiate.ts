import { PHYSICS_AMMO } from 'internal:constants';
import { instantiate } from '../framework/physics-selector';
import { AmmoRigidBody } from './ammo-rigid-body';
import { AmmoWorld } from '../ammo/ammo-world';
import { AmmoBoxShape } from '../ammo/shapes/ammo-box-shape';
import { AmmoSphereShape } from '../ammo/shapes/ammo-sphere-shape';
import { AmmoCapsuleShape } from '../ammo/shapes/ammo-capsule-shape';
import { AmmoBvhTriangleMeshShape } from '../ammo/shapes/ammo-bvh-triangle-mesh-shape';
import { AmmoCylinderShape } from '../ammo/shapes/ammo-cylinder-shape';
import { AmmoConeShape } from "../ammo/shapes/ammo-cone-shape";
import { AmmoTerrainShape } from "../ammo/shapes/ammo-terrain-shape";
import { AmmoSimplexShape } from "./shapes/ammo-simplex-shape";
import { AmmoPlaneShape } from "../ammo/shapes/ammo-plane-shape";

import { AmmoPointToPointConstraint } from './constraints/ammo-point-to-point-constraint';
import { AmmoHingeConstraint } from './constraints/ammo-hinge-constraint';

if (PHYSICS_AMMO) {
    instantiate({
        PhysicsWorld: AmmoWorld,
        RigidBody: AmmoRigidBody,

        BoxShape: AmmoBoxShape,
        SphereShape: AmmoSphereShape,
        CapsuleShape: AmmoCapsuleShape,
        TrimeshShape: AmmoBvhTriangleMeshShape,
        CylinderShape: AmmoCylinderShape,
        ConeShape: AmmoConeShape,
        TerrainShape: AmmoTerrainShape,
        SimplexShape: AmmoSimplexShape,
        PlaneShape: AmmoPlaneShape,

        PointToPointConstraint: AmmoPointToPointConstraint,
        HingeConstraint: AmmoHingeConstraint,
    });
}

import './deprecated';