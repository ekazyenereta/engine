import * as OIMO from '@cocos/oimo';
import { Vec3 } from '../../core/math';
import { fillRaycastResult, toCannonRaycastOptions } from './oimo-util';
import { OimoShape } from './shapes/oimo-shape';
import { ray } from '../../core/geom-utils';
import { RecyclePool, Node } from '../../core';
import { OimoSharedBody } from './oimo-shared-body';
import { IPhysicsWorld, IRaycastOptions } from '../spec/i-physics-world';
import { PhysicMaterial, PhysicsRayResult } from '../framework';

export class OimoWorld implements IPhysicsWorld {

    get world () {
        return this._world;
    }

    set defaultMaterial (mat: PhysicMaterial) {
        // this._world.defaultMaterial.friction = mat.friction;
        // this._world.defaultMaterial.restitution = mat.restitution;
        // if (OimoShape.idToMaterial[mat._uuid] != null) {
        //     OimoShape.idToMaterial[mat._uuid] = this._world.defaultMaterial;
        // }
    }

    set allowSleep (v: boolean) {
        // this._world.allowSleep = v;
    }

    set gravity (gravity: Vec3) {
        Vec3.copy(this._world.gravity, gravity);
    }

    // get defaultContactMaterial () {
    //     return this._defaultContactMaterial;
    // }

    readonly bodies: OimoSharedBody[] = [];

    private _world: OIMO.World;
    private _raycastResult = {};//new OIMO.RaycastResult();

    constructor () {
        this._world = new OIMO.World({});
        // this._world.broadphase = new OIMO.NaiveBroadphase();
    }

    step (deltaTime: number, timeSinceLastCalled?: number, maxSubStep?: number) {
        // sync scene to physics
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].syncSceneToPhysics();
        }

        // this._world.step(deltaTime, timeSinceLastCalled, maxSubStep);
        this._world.step();

        // sync physics to scene
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].syncPhysicsToScene();
        }

        // this._world.emitTriggeredEvents();
        // this._world.emitCollisionEvents();
    }

    raycastClosest (worldRay: ray, options: IRaycastOptions, result: PhysicsRayResult): boolean {
        // setupFromAndTo(worldRay, options.maxDistance);
        // toCannonRaycastOptions(raycastOpt, options);
        // const hit = this._world.raycastClosest(from, to, raycastOpt, this._raycastResult);
        // if (hit) {
        //     fillRaycastResult(result, this._raycastResult);
        // }
        // return hit;
        return false;
    }

    raycast (worldRay: ray, options: IRaycastOptions, pool: RecyclePool<PhysicsRayResult>, results: PhysicsRayResult[]): boolean {
        // setupFromAndTo(worldRay, options.maxDistance);
        // toCannonRaycastOptions(raycastOpt, options);
        // const hit = this._world.raycastAll(from, to, raycastOpt, (result: OIMO.RaycastResult): any => {
        //     const r = pool.add();
        //     fillRaycastResult(r, result);
        //     results.push(r);
        // });
        // return hit;        
        return false;
    }

    getSharedBody (node: Node): OimoSharedBody {
        return OimoSharedBody.getSharedBody(node, this);
    }

    addSharedBody (sharedBody: OimoSharedBody) {
        const i = this.bodies.indexOf(sharedBody);
        if (i < 0) {
            this.bodies.push(sharedBody);
            // this._world.addBody(sharedBody.body);
        }
    }

    removeSharedBody (sharedBody: OimoSharedBody) {
        const i = this.bodies.indexOf(sharedBody);
        if (i >= 0) {
            this.bodies.splice(i, 1);
            this._world.removeRigidBody(sharedBody.body);
        }
    }

    //  addContactMaterial (contactMaterial: ContactMaterial) {
    //     this._cannonWorld.addContactMaterial(contactMaterial._getImpl());
    // }

    // addConstraint (constraint: CannonConstraint) {
    //     this._world.addConstraint(constraint.impl);
    // }

    // removeConstraint (constraint: CannonConstraint) {
    //     this._world.removeConstraint(constraint.impl);
    // }
}

// const from = new OIMO.Vec3();
// const to = new OIMO.Vec3();
// function setupFromAndTo (worldRay: ray, distance: number) {
//     Vec3.copy(from, worldRay.o);
//     worldRay.computeHit(to, distance);
// }

// const raycastOpt: OIMO.IRaycastOptions = {
//     'checkCollisionResponse': false,
//     'collisionFilterGroup': -1,
//     'collisionFilterMask': -1,
//     'skipBackFaces': false
// }