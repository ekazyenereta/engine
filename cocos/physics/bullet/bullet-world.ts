import { BULLET } from './bullet-export';
import { Vec3 } from "../../core/math";
import { BulletSharedBody } from "./bullet-shared-body";
import { BulletRigidBody } from "./bullet-rigid-body";
import { BulletShape } from './shapes/bullet-shape';
import { ArrayCollisionMatrix } from '../utils/array-collision-matrix';
import { TupleDictionary } from '../utils/tuple-dictionary';
import { TriggerEventObject, CollisionEventObject } from './bullet-const';
import { bullet2CocosVec3, cocos2BulletVec3, cocos2BulletQuat } from './bullet-util';
import { ray } from '../../core/geometry';
import { IRaycastOptions, IPhysicsWorld } from '../spec/i-physics-world';
import { PhysicsRayResult, PhysicMaterial } from '../framework';
import { Node, RecyclePool } from '../../core';
import { BulletInstance } from './bullet-instance';
import { btCollisionFilterGroups } from './bullet-enum';
import { IVec3Like } from '../../core/math/type-define';

const contactsPool = [] as any;
const v3_0 = new Vec3();
const v3_1 = new Vec3();

export class BulletWorld implements IPhysicsWorld {

    setAllowSleep (v: boolean) { };
    setDefaultMaterial (v: PhysicMaterial) { };

    setGravity (gravity: IVec3Like) {
        cocos2BulletVec3(this._btGravity, gravity);
        BULLET.btRigidBody_setGravity(this._btWorld, this._btGravity);
    }

    get impl () {
        return this._btWorld;
    }

    private readonly _btWorld: number;
    private readonly _btBroadphase: number;
    private readonly _btSolver: number;
    private readonly _btDispatcher: number;
    private readonly _btGravity: number;

    readonly bodies: BulletSharedBody[] = [];
    readonly ghosts: BulletSharedBody[] = [];
    readonly triggerArrayMat = new ArrayCollisionMatrix();
    readonly collisionArrayMat = new ArrayCollisionMatrix();
    readonly contactsDic = new TupleDictionary();
    readonly oldContactsDic = new TupleDictionary();

    readonly closeHitCB = BULLET.ClosestRayResultCallback_create(BULLET.btVector3_create(0, 0, 0), BULLET.btVector3_create(0, 0, 0));
    readonly allHitsCB = BULLET.AllHitsRayResultCallback_create(BULLET.btVector3_create(0, 0, 0), BULLET.btVector3_create(0, 0, 0));

    constructor (options?: any) {
        const collisionConfiguration = BULLET.btDefaultCollisionConfiguration_create();
        this._btDispatcher = BULLET.btCollisionDispatcher_create(collisionConfiguration);
        this._btBroadphase = BULLET.btDbvtBroadphase_create();
        this._btSolver = BULLET.btSequentialImpulseConstraintSolver_create();
        this._btWorld = BULLET.btDiscreteDynamicsWorld_create(this._btDispatcher, this._btBroadphase, this._btSolver, collisionConfiguration);
        this._btGravity = BULLET.btVector3_create(0, -10, 0);
        BULLET.btRigidBody_setGravity(this._btWorld, this._btGravity);
    }

    step (timeStep: number, fixTimeStep?: number, maxSubStep?: number) {

        for (let i = 0; i < this.ghosts.length; i++) {
            this.ghosts[i].syncSceneToGhost();
        }

        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].syncSceneToPhysics();
        }

        BULLET.btDiscreteDynamicsWorld_stepSimulation(this._btWorld, timeStep, maxSubStep, fixTimeStep);

        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].syncPhysicsToScene();
        }

        // this.emitEvents();

        // sync scene to physics again
        for (let i = 0; i < this.ghosts.length; i++) {
            this.ghosts[i].syncSceneToGhost();
        }

        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].syncSceneToPhysics();
        }

    }

    raycast (worldRay: ray, options: IRaycastOptions, pool: RecyclePool<PhysicsRayResult>, results: PhysicsRayResult[]): boolean {
        const ptr = this.allHitsCB;
        const from = cocos2BulletVec3(BULLET.AllHitsRayResultCallback_get_m_rayFromWorld(ptr), worldRay.o);
        worldRay.computeHit(v3_0, options.maxDistance);
        const to = cocos2BulletVec3(BULLET.AllHitsRayResultCallback_get_m_rayToWorld(ptr), v3_0);
        // BULLET.RayResultCallback_set_m_collisionFilterGroup(ptr, -1);
        // BULLET.RayResultCallback_set_m_collisionFilterMask(ptr, options.mask);
        // BULLET.RayResultCallback_set_m_closestHitFraction(ptr, 1);
        // BULLET.RayResultCallback_set_m_collisionObject(ptr, null);
        // this.allHitsCB.m_shapePart = -1;
        // (this.allHitsCB.m_collisionObject as any) = null;
        // this.allHitsCB.m_shapeParts.clear();
        // this.allHitsCB.m_hitFractions.clear();
        // this.allHitsCB.m_collisionObjects.clear();
        // // TODO: typing
        // const hp = (this.allHitsCB.m_hitPointWorld as any);
        // const hn = (this.allHitsCB.m_hitNormalWorld as any);
        // hp.clear();
        // hn.clear();
        BULLET.RayResultCallback_reset(ptr, options.group, options.mask);
        BULLET.AllHitsRayResultCallback_reset(ptr);
        BULLET.btCollisionWorld_rayTest(this._btWorld, from, to, ptr);
        const hasHit = BULLET.RayResultCallback_hasHit(ptr);
        if (hasHit) {
            const m_collisionObjects = BULLET.AllHitsRayResultCallback_get_m_collisionObjects(ptr);
            const m_shapeParts = BULLET.AllHitsRayResultCallback_get_m_shapeParts(ptr);
            const m_hitPointWorld = BULLET.AllHitsRayResultCallback_get_m_hitPointWorld(ptr);
            const m_hitNormalWorld = BULLET.AllHitsRayResultCallback_get_m_hitNormalWorld(ptr);
            const size = BULLET.tBtCollisionObjectArray_size(m_collisionObjects);
            for (let i = 0; i < size; i++) {
                const shapeIndex = BULLET.tScalarArray_at(m_shapeParts, i);
                const btObj = BULLET.tBtCollisionObjectArray_at(m_collisionObjects, i);
                const index = BULLET.btCollisionObject_getUserIndex(btObj);
                const shared = BulletInstance.bodyAndGhosts['KEY' + index];
                const shape = shared.wrappedShapes[shapeIndex];
                bullet2CocosVec3(v3_0, BULLET.tVector3Array_at(m_hitPointWorld, i));
                bullet2CocosVec3(v3_1, BULLET.tVector3Array_at(m_hitNormalWorld, i));
                const distance = Vec3.distance(worldRay.o, v3_0);
                const r = pool.add();
                r._assign(v3_0, distance, shape.collider, v3_1);
                results.push(r);
            }
            return true;
        }
        return false;
    }

    /**
     * Ray cast, and return information of the closest hit.
     * @return True if any body was hit.
     */
    raycastClosest (worldRay: ray, options: IRaycastOptions, result: PhysicsRayResult): boolean {
        const ptr = this.closeHitCB;
        const from = cocos2BulletVec3(BULLET.AllHitsRayResultCallback_get_m_rayFromWorld(ptr), worldRay.o);
        worldRay.computeHit(v3_0, options.maxDistance);
        const to = cocos2BulletVec3(BULLET.AllHitsRayResultCallback_get_m_rayToWorld(ptr), v3_0);
        // BULLET.RayResultCallback_set_m_collisionFilterGroup(ptr, -1);
        // BULLET.RayResultCallback_set_m_collisionFilterMask(ptr, options.mask);
        // BULLET.RayResultCallback_set_m_closestHitFraction(ptr, 1);
        // BULLET.RayResultCallback_set_m_collisionObject(ptr, null);
        BULLET.RayResultCallback_reset(ptr, options.group, options.mask);
        BULLET.btCollisionWorld_rayTest(this._btWorld, from, to, ptr);
        const hasHit = BULLET.RayResultCallback_hasHit(ptr);
        if (hasHit) {
            const btObj = BULLET.RayResultCallback_get_m_collisionObject(ptr);
            const index = BULLET.btCollisionObject_getUserIndex(btObj);
            const shared = BulletInstance.bodyAndGhosts['KEY' + index];
            const shapeIndex = BULLET.RayResultCallback_get_m_shapePart(ptr);
            const shape = shared.wrappedShapes[shapeIndex];
            bullet2CocosVec3(v3_0, BULLET.ClosestRayResultCallback_get_m_hitPointWorld(ptr));
            bullet2CocosVec3(v3_1, BULLET.ClosestRayResultCallback_get_m_hitNormalWorld(ptr));
            const distance = Vec3.distance(worldRay.o, v3_0);
            result._assign(v3_0, distance, shape.collider, v3_1);
            return true;
        }
        return false;
    }

    getSharedBody (node: Node, wrappedBody?: BulletRigidBody) {
        return BulletSharedBody.getSharedBody(node, this, wrappedBody);
    }

    addSharedBody (sharedBody: BulletSharedBody) {
        const i = this.bodies.indexOf(sharedBody);
        if (i < 0) {
            this.bodies.push(sharedBody);
            BULLET.btDiscreteDynamicsWorld_addRigidBody(this._btWorld, sharedBody.body, sharedBody.collisionFilterGroup, sharedBody.collisionFilterMask);
        }
    }

    removeSharedBody (sharedBody: BulletSharedBody) {
        const i = this.bodies.indexOf(sharedBody);
        if (i >= 0) {
            this.bodies.splice(i, 1);
            BULLET.btDiscreteDynamicsWorld_removeRigidBody(this._btWorld, sharedBody.body);
        }
    }

    addGhostObject (sharedBody: BulletSharedBody) {
        const i = this.ghosts.indexOf(sharedBody);
        if (i < 0) {
            this.ghosts.push(sharedBody);
            BULLET.btCollisionWorld_addCollisionObject(this._btWorld, sharedBody.ghost, sharedBody.collisionFilterGroup, sharedBody.collisionFilterMask);
        }
    }

    removeGhostObject (sharedBody: BulletSharedBody) {
        const i = this.ghosts.indexOf(sharedBody);
        if (i >= 0) {
            this.ghosts.splice(i, 1);
            BULLET.btCollisionWorld_removeCollisionObject(this._btWorld, sharedBody.ghost);
        }
    }

    emitEvents () {
        // collect
        const numManifolds = BULLET.btDispatcher_getNumManifolds(this._btDispatcher);
        for (let i = 0; i < numManifolds; i++) {
            const manifold = BULLET.btDispatcher_getManifoldByIndexInternal(this._btDispatcher, i);
            const body0 = BULLET.btPersistentManifold_getBody0(manifold);
            const body1 = BULLET.btPersistentManifold_getBody1(manifold);
            const index0 = BULLET.btCollisionObject_getUserIndex(body0);
            const index1 = BULLET.btCollisionObject_getUserIndex(body1);
            const numContacts = BULLET.btPersistentManifold_getNumContacts(manifold);
            for (let j = 0; j < numContacts; j++) {
                const manifoldPoint = BULLET.btPersistentManifold_getContactPoint(j);
                const d = BULLET.btManifoldPoint_getDistance(manifoldPoint);
                if (d <= 0.0001) {
                    const s0 = BULLET.btManifoldPoint_getShape0();
                    const s1 = BULLET.btManifoldPoint_getShape1();
                    let sindex0 = 0;
                    let sindex1 = 0;
                    if (BULLET.btCollisionShape_isCompound(s0)) {
                        sindex0 = BULLET.btManifoldPoint_get_m_index0(manifoldPoint);
                    } else {
                        sindex0 = BULLET.btCollisionShape_getUserIndex(s0);
                    }

                    if (BULLET.btCollisionShape_isCompound(s1)) {
                        sindex1 = BULLET.btManifoldPoint_get_m_index1(manifoldPoint);
                    } else {
                        sindex1 = BULLET.btCollisionShape_getUserIndex(s1);
                    }

                    const key0 = 'KEY' + index0;
                    const key1 = 'KEY' + index1;
                    const shared0 = BulletInstance.bodyAndGhosts[key0];
                    const shared1 = BulletInstance.bodyAndGhosts[key1];
                    const shape0 = shared0.wrappedShapes[sindex0];
                    const shape1 = shared1.wrappedShapes[sindex1];

                    // current contact
                    var item = this.contactsDic.get(shape0.id, shape1.id) as any;
                    if (item == null) {
                        item = this.contactsDic.set(shape0.id, shape1.id,
                            {
                                shape0: shape0,
                                shape1: shape1,
                                contacts: []
                            }
                        );
                    }
                    item.contacts.push(manifoldPoint);
                }
            }
        }

        // is enter or stay
        let dicL = this.contactsDic.getLength();
        while (dicL--) {
            for (let j = CollisionEventObject.contacts.length; j--;) {
                contactsPool.push(CollisionEventObject.contacts.pop());
            }

            const key = this.contactsDic.getKeyByIndex(dicL);
            const data = this.contactsDic.getDataByKey(key) as any;
            const shape0: BulletShape = data.shape0;
            const shape1: BulletShape = data.shape1;
            this.oldContactsDic.set(shape0.id, shape1.id, data);
            const collider0 = shape0.collider;
            const collider1 = shape1.collider;
            if (collider0 && collider1) {
                const isTrigger = collider0.isTrigger || collider1.isTrigger;
                if (isTrigger) {
                    if (this.triggerArrayMat.get(shape0.id, shape1.id)) {
                        TriggerEventObject.type = 'onTriggerStay';
                    } else {
                        TriggerEventObject.type = 'onTriggerEnter';
                        this.triggerArrayMat.set(shape0.id, shape1.id, true);
                    }
                    TriggerEventObject.selfCollider = collider0;
                    TriggerEventObject.otherCollider = collider1;
                    collider0.emit(TriggerEventObject.type, TriggerEventObject);

                    TriggerEventObject.selfCollider = collider1;
                    TriggerEventObject.otherCollider = collider0;
                    collider1.emit(TriggerEventObject.type, TriggerEventObject);
                } else {
                    if (this.collisionArrayMat.get(shape0.id, shape1.id)) {
                        CollisionEventObject.type = 'onCollisionStay';
                    } else {
                        CollisionEventObject.type = 'onCollisionEnter';
                        this.collisionArrayMat.set(shape0.id, shape1.id, true);
                    }

                    for (let i = 0; i < data.contacts.length; i++) {
                        const cq = data.contacts[i];
                        if (contactsPool.length > 0) {
                            const c = contactsPool.pop();
                            bullet2CocosVec3(c.contactA, BULLET.btManifoldPoint_get_m_positionWorldOnA(cq));
                            bullet2CocosVec3(c.contactB, BULLET.btManifoldPoint_get_m_positionWorldOnB(cq));
                            bullet2CocosVec3(c.normal, BULLET.btManifoldPoint_get_m_normalWorldOnB(cq));
                            CollisionEventObject.contacts.push(c);
                        } else {
                            const c = {
                                contactA: bullet2CocosVec3(new Vec3(), BULLET.btManifoldPoint_get_m_positionWorldOnA(cq)),
                                contactB: bullet2CocosVec3(new Vec3(), BULLET.btManifoldPoint_get_m_positionWorldOnB(cq)),
                                normal: bullet2CocosVec3(new Vec3(), BULLET.btManifoldPoint_get_m_normalWorldOnB(cq)),
                            };
                            CollisionEventObject.contacts.push(c);
                        }
                    }

                    CollisionEventObject.selfCollider = collider0;
                    CollisionEventObject.otherCollider = collider1;
                    collider0.emit(CollisionEventObject.type, CollisionEventObject);

                    CollisionEventObject.selfCollider = collider1;
                    CollisionEventObject.otherCollider = collider0;
                    collider1.emit(CollisionEventObject.type, CollisionEventObject);
                }

                if (this.oldContactsDic.get(shape0.id, shape1.id) == null) {
                    this.oldContactsDic.set(shape0.id, shape1.id, data);
                }
            }
        }

        // is exit
        let oldDicL = this.oldContactsDic.getLength();
        while (oldDicL--) {
            let key = this.oldContactsDic.getKeyByIndex(oldDicL);
            let data = this.oldContactsDic.getDataByKey(key) as any;
            const shape0: BulletShape = data.shape0;
            const shape1: BulletShape = data.shape1;
            const collider0 = shape0.collider;
            const collider1 = shape1.collider;
            if (collider0 && collider1) {
                const isTrigger = collider0.isTrigger || collider1.isTrigger;
                if (this.contactsDic.getDataByKey(key) == null) {
                    if (isTrigger) {
                        // emit exit
                        if (this.triggerArrayMat.get(shape0.id, shape1.id)) {
                            TriggerEventObject.type = 'onTriggerExit';
                            TriggerEventObject.selfCollider = collider0;
                            TriggerEventObject.otherCollider = collider1;
                            collider0.emit(TriggerEventObject.type, TriggerEventObject);

                            TriggerEventObject.selfCollider = collider1;
                            TriggerEventObject.otherCollider = collider0;
                            collider1.emit(TriggerEventObject.type, TriggerEventObject);

                            this.triggerArrayMat.set(shape0.id, shape1.id, false);
                            this.oldContactsDic.set(shape0.id, shape1.id, null);
                        }
                    }
                    else {
                        // emit exit
                        if (this.collisionArrayMat.get(shape0.id, shape1.id)) {
                            for (let j = CollisionEventObject.contacts.length; j--;) {
                                contactsPool.push(CollisionEventObject.contacts.pop());
                            }

                            for (let i = 0; i < data.contacts.length; i++) {
                                const cq = data.contacts[i] as Ammo.btManifoldPoint;
                                if (contactsPool.length > 0) {
                                    const c = contactsPool.pop();
                                    bullet2CocosVec3(c.contactA, BULLET.btManifoldPoint_get_m_positionWorldOnA(cq));
                                    bullet2CocosVec3(c.contactB, BULLET.btManifoldPoint_get_m_positionWorldOnB(cq));
                                    bullet2CocosVec3(c.normal, BULLET.btManifoldPoint_get_m_normalWorldOnB(cq));
                                    CollisionEventObject.contacts.push(c);
                                } else {
                                    const c = {
                                        contactA: bullet2CocosVec3(new Vec3(), BULLET.btManifoldPoint_get_m_positionWorldOnA(cq)),
                                        contactB: bullet2CocosVec3(new Vec3(), BULLET.btManifoldPoint_get_m_positionWorldOnB(cq)),
                                        normal: bullet2CocosVec3(new Vec3(), BULLET.btManifoldPoint_get_m_normalWorldOnB(cq)),
                                    };
                                    CollisionEventObject.contacts.push(c);
                                }
                            }

                            CollisionEventObject.type = 'onCollisionExit';
                            CollisionEventObject.selfCollider = collider0;
                            CollisionEventObject.otherCollider = collider1;
                            collider0.emit(CollisionEventObject.type, CollisionEventObject);

                            CollisionEventObject.selfCollider = collider1;
                            CollisionEventObject.otherCollider = collider0;
                            collider1.emit(CollisionEventObject.type, CollisionEventObject);

                            this.collisionArrayMat.set(shape0.id, shape1.id, false);
                            this.oldContactsDic.set(shape0.id, shape1.id, null);
                        }
                    }
                }
            }
        }

        this.contactsDic.reset();
    }
}
