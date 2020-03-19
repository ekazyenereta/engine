import { BULLET } from './bullet-export';
import { Quat, Vec3 } from '../../core/math';
import { TransformBit } from '../../core/scene-graph/node-enum';
import { Node } from '../../core';
import { BulletWorld } from './bullet-world';
import { BulletRigidBody } from './bullet-rigid-body';
import { BulletShape } from './shapes/bullet-shape';
import { cocos2BulletVec3, cocos2BulletQuat, bullet2CocosVec3, bullet2CocosQuat } from './bullet-util';
import { btCollisionFlags, btCollisionObjectStates } from './bullet-enum';
import { BulletInstance } from './bullet-instance';
import { IAmmoBodyStruct, IAmmoGhostStruct } from './bullet-interface';

const v3_0 = new Vec3();
const quat_0 = new Quat();
let sharedIDCounter = 0;

/**
 * shared object, node : shared = 1 : 1
 * body for static \ dynamic \ kinematic (collider)
 * ghost for trigger
 */
export class BulletSharedBody {

    private static idCounter = 0;
    private static readonly sharedBodesMap = new Map<string, BulletSharedBody>();

    static getSharedBody (node: Node, wrappedWorld: BulletWorld, wrappedBody?: BulletRigidBody) {
        const key = node.uuid;
        let newSB!: BulletSharedBody;
        if (BulletSharedBody.sharedBodesMap.has(key)) {
            newSB = BulletSharedBody.sharedBodesMap.get(key)!;
        } else {
            newSB = new BulletSharedBody(node, wrappedWorld);
            BulletSharedBody.sharedBodesMap.set(node.uuid, newSB);
        }
        if (wrappedBody) { newSB._wrappedBody = wrappedBody; }
        return newSB;
    }

    get wrappedBody () {
        return this._wrappedBody;
    }

    get bodyCompoundShape () {
        return this.bodyStruct.shape;
    }

    get ghostCompoundShape () {
        return this.ghostStruct.shape;
    }

    get body () {
        return this.bodyStruct.body;
    }

    get ghost () {
        return this.ghostStruct.ghost;
    }

    get collisionFilterGroup () { return this._collisionFilterGroup; }
    set collisionFilterGroup (v: number) {
        if (v != this._collisionFilterGroup) {
            this._collisionFilterGroup = v;
            this.updateByReAdd();
        }
    }

    get collisionFilterMask () { return this._collisionFilterMask; }
    set collisionFilterMask (v: number) {
        if (v != this._collisionFilterMask) {
            this._collisionFilterMask = v;
            this.updateByReAdd();
        }
    }

    readonly id: number;
    readonly node: Node;
    readonly wrappedWorld: BulletWorld;
    readonly bodyStruct: IAmmoBodyStruct;
    readonly ghostStruct: IAmmoGhostStruct;

    private _collisionFilterGroup: number = 1;
    private _collisionFilterMask: number = -1;

    private ref: number = 0;
    private bodyIndex: number = -1;
    private ghostIndex: number = -1;
    private _wrappedBody: BulletRigidBody | null = null;

    /**
     * add or remove from world \
     * add, if enable \
     * remove, if disable & shapes.length == 0 & wrappedBody disable
     */
    set bodyEnabled (v: boolean) {
        if (v) {
            if (this.bodyIndex < 0) {
                this.bodyIndex = this.wrappedWorld.bodies.length;
                this.wrappedWorld.addSharedBody(this);
                this.syncInitialBody();
            }
        } else {
            if (this.bodyIndex >= 0) {
                const isRemoveBody = (this.bodyStruct.wrappedShapes.length == 0 && this.wrappedBody == null) ||
                    (this.bodyStruct.wrappedShapes.length == 0 && this.wrappedBody != null && !this.wrappedBody.isEnabled) ||
                    (this.bodyStruct.wrappedShapes.length == 0 && this.wrappedBody != null && !this.wrappedBody.rigidBody.enabledInHierarchy)

                if (isRemoveBody) {
                    // this.body.clearState(); // clear velocity etc.
                    this.bodyIndex = -1;
                    this.wrappedWorld.removeSharedBody(this);
                }

            }
        }
    }

    set ghostEnabled (v: boolean) {
        if (v) {
            if (this.ghostIndex < 0 && this.ghostStruct.wrappedShapes.length > 0) {
                this.ghostIndex = 1;
                this.wrappedWorld.addGhostObject(this);
                this.syncInitialGhost();
            }
        } else {
            if (this.ghostIndex >= 0) {
                /** remove trigger */
                const isRemoveGhost = (this.ghostStruct.wrappedShapes.length == 0 && this.ghost);

                if (isRemoveGhost) {
                    this.ghostIndex = -1;
                    this.wrappedWorld.removeGhostObject(this);
                }
            }
        }
    }

    set reference (v: boolean) {
        v ? this.ref++ : this.ref--;
        if (this.ref == 0) { this.destroy(); }
    }

    private constructor (node: Node, wrappedWorld: BulletWorld) {
        this.wrappedWorld = wrappedWorld;
        this.node = node;
        this.id = BulletSharedBody.idCounter++;

        /** body struct */
        const st: number = BULLET.btTransform_create();
        cocos2BulletVec3(BULLET.btTransform_getOrigin(st), this.node.worldPosition)
        const bodyQuat = BULLET.btQuaternion_create(0, 0, 0, 1);
        cocos2BulletQuat(bodyQuat, this.node.worldRotation);
        BULLET.btTransform_setRotation(st, bodyQuat);
        const motionState = BULLET.CCMotionState_create();//BULLET.btDefaultMotionState_create(st);
        const localInertia = BULLET.btVector3_create(1.6666666269302368, 1.6666666269302368, 1.6666666269302368);
        const bodyShape = BULLET.btCompoundShape_create();
        const rbInfo = BULLET.btRigidBodyConstructionInfo_create(0, motionState, bodyShape, localInertia);
        const body = BULLET.btRigidBody_create(rbInfo);
        this.bodyStruct = {
            'id': sharedIDCounter++,
            'body': body,
            'localInertia': localInertia,
            'motionState': motionState,
            'startTransform': st,
            'shape': bodyShape,
            'rbInfo': rbInfo,
            'worldQuat': bodyQuat,
            'wrappedShapes': []
        }
        BulletInstance.bodyStructs['KEY' + this.bodyStruct.id] = this.bodyStruct;
        BULLET.btCollisionObject_setUserIndex(this.body, this.bodyStruct.id);

        /** ghost struct */
        const ghost = BULLET.btCollisionObject_create();
        const ghostShape = BULLET.btCompoundShape_create();
        BULLET.btCollisionObject_setCollisionShape(ghost, ghostShape);
        BULLET.btCollisionObject_setCollisionFlags(ghost, btCollisionFlags.CF_NO_CONTACT_RESPONSE);
        this.ghostStruct = {
            'id': sharedIDCounter++,
            'ghost': ghost,
            'shape': ghostShape,
            'worldQuat': BULLET.btQuaternion_create(0, 0, 0, 1),
            'wrappedShapes': []
        }
        BulletInstance.ghostStructs['KEY' + this.ghostStruct.id] = this.ghostStruct;
        BULLET.btCollisionObject_setUserIndex(this.ghost, this.ghostStruct.id);

        /** DEBUG */
        BULLET.btCollisionObject_forceActivationState(this.body, btCollisionObjectStates.DISABLE_DEACTIVATION);
        BULLET.btCollisionObject_forceActivationState(this.ghost, btCollisionObjectStates.DISABLE_DEACTIVATION);
    }

    addShape (v: BulletShape, isTrigger: boolean) {
        if (isTrigger) {
            const index = this.ghostStruct.wrappedShapes.indexOf(v);
            if (index < 0) {
                this.ghostStruct.wrappedShapes.push(v);
                v.setCompound(this.ghostCompoundShape);
                this.ghostEnabled = true;
            }
        } else {
            const index = this.bodyStruct.wrappedShapes.indexOf(v);
            if (index < 0) {
                this.bodyStruct.wrappedShapes.push(v);
                v.setCompound(this.bodyCompoundShape);
                this.bodyEnabled = true;
            }
        }
    }

    removeShape (v: BulletShape, isTrigger: boolean) {
        if (isTrigger) {
            const index = this.ghostStruct.wrappedShapes.indexOf(v);
            if (index >= 0) {
                this.ghostStruct.wrappedShapes.splice(index, 1);
                v.setCompound(null);
                this.ghostEnabled = false;
            }
        } else {
            const index = this.bodyStruct.wrappedShapes.indexOf(v);
            if (index >= 0) {
                this.bodyStruct.wrappedShapes.splice(index, 1);
                v.setCompound(null);
                this.bodyEnabled = false;
            }
        }
    }

    syncSceneToPhysics () {
        if (this.node.hasChangedFlags) {
            const wt = BULLET.btCollisionObject_getWorldTransform(this.body);            
            cocos2BulletVec3(BULLET.btTransform_getOrigin(wt), this.node.worldPosition)
            cocos2BulletQuat(this.bodyStruct.worldQuat, this.node.worldRotation);
            BULLET.btTransform_setRotation(wt, this.bodyStruct.worldQuat);
            // this.body.activate();

            if (this.node.hasChangedFlags & TransformBit.SCALE) {
                for (let i = 0; i < this.bodyStruct.wrappedShapes.length; i++) {
                    this.bodyStruct.wrappedShapes[i].updateScale();
                }
            }
        }
    }

    /**
     * TODO: use motionstate
     */
    syncPhysicsToScene () {
        // if (this.body.isStaticObject() || !this.body.isActive()) {
        //     return;
        // }

        // let transform = new Ammo.btTransform();
        // this.body.getMotionState().getWorldTransform(transform);
        const wt0 = BULLET.btCollisionObject_getWorldTransform(this.body);
        this.node.worldPosition = bullet2CocosVec3(v3_0, BULLET.btTransform_getOrigin(wt0));
        this.node.worldRotation = bullet2CocosQuat(quat_0, BULLET.btTransform_getRotationRef(wt0));

        const wt1 = BULLET.btCollisionObject_getWorldTransform(this.ghost);
        cocos2BulletVec3(BULLET.btTransform_getOrigin(wt1), this.node.worldPosition)
        cocos2BulletQuat(this.ghostStruct.worldQuat, this.node.worldRotation);
        BULLET.btTransform_setRotation(wt1, this.ghostStruct.worldQuat);
    }

    syncSceneToGhost () {
        if (this.node.hasChangedFlags) {
            const wt1 = BULLET.btCollisionObject_getWorldTransform(this.ghost);
            cocos2BulletVec3(BULLET.btTransform_getOrigin(wt1), this.node.worldPosition)
            cocos2BulletQuat(this.ghostStruct.worldQuat, this.node.worldRotation);
            BULLET.btTransform_setRotation(wt1, this.ghostStruct.worldQuat);
            // this.ghost.activate();

            if (this.node.hasChangedFlags & TransformBit.SCALE) {
                for (let i = 0; i < this.ghostStruct.wrappedShapes.length; i++) {
                    this.ghostStruct.wrappedShapes[i].updateScale();
                }
            }
        }
    }

    syncInitialBody () {
        const wt = BULLET.btCollisionObject_getWorldTransform(this.body);
        cocos2BulletVec3(BULLET.btTransform_getOrigin(wt), this.node.worldPosition)
        cocos2BulletQuat(this.bodyStruct.worldQuat, this.node.worldRotation);
        BULLET.btTransform_setRotation(wt, this.bodyStruct.worldQuat);
        for (let i = 0; i < this.bodyStruct.wrappedShapes.length; i++) {
            this.bodyStruct.wrappedShapes[i].updateScale();
        }
        // this.body.activate();
    }

    syncInitialGhost () {
        const wt1 = BULLET.btCollisionObject_getWorldTransform(this.ghost);
        cocos2BulletVec3(BULLET.btTransform_getOrigin(wt1), this.node.worldPosition)
        cocos2BulletQuat(this.ghostStruct.worldQuat, this.node.worldRotation);
        BULLET.btTransform_setRotation(wt1, this.ghostStruct.worldQuat);
        for (let i = 0; i < this.ghostStruct.wrappedShapes.length; i++) {
            this.ghostStruct.wrappedShapes[i].updateScale();
        }
        // this.ghost.activate();
    }

    // private updateGroupMask () {
    //     const body = this.bodyStruct.body;
    //     const bodyProxy = body.getBroadphaseHandle();
    //     bodyProxy.m_collisionFilterGroup = this.collisionFilterGroup;
    //     bodyProxy.m_collisionFilterMask = this.collisionFilterMask;
    //     const ghost = this.ghostStruct.ghost;
    //     const ghostProxy = ghost.getBroadphaseHandle();
    //     ghostProxy.m_collisionFilterGroup = this.collisionFilterGroup;
    //     ghostProxy.m_collisionFilterMask = this.collisionFilterMask;
    // }

    updateByReAdd () {
        /**
         * see: https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=9&t=5312&p=19094&hilit=how+to+change+group+mask#p19097
         */
        if (this.bodyIndex >= 0) {
            this.wrappedWorld.removeSharedBody(this);
            this.wrappedWorld.addSharedBody(this);
            this.bodyIndex = this.wrappedWorld.bodies.length;
        }
        if (this.ghostIndex >= 0) {
            this.wrappedWorld.removeGhostObject(this);
            this.wrappedWorld.addGhostObject(this);
            this.ghostIndex = this.wrappedWorld.ghosts.length;
        }
    }

    private destroy () {
        BulletSharedBody.sharedBodesMap.delete(this.node.uuid);
        (this.node as any) = null;
        (this.wrappedWorld as any) = null;

        const bodyStruct = this.bodyStruct;
        // // Ammo.destroy(bodyStruct.body);
        // Ammo.destroy(bodyStruct.localInertia);
        // // Ammo.destroy(bodyStruct.motionState);
        // // Ammo.destroy(bodyStruct.rbInfo);
        // // Ammo.destroy(bodyStruct.shape);
        // // Ammo.destroy(bodyStruct.startTransform);
        // Ammo.destroy(bodyStruct.worldQuat);
        // ammoDeletePtr(bodyStruct.motionState, Ammo.btDefaultMotionState);
        // ammoDeletePtr(bodyStruct.rbInfo, Ammo.btRigidBodyConstructionInfo);
        // ammoDeletePtr(bodyStruct.body, Ammo.btRigidBody);
        // ammoDeletePtr(bodyStruct.body, Ammo.btCollisionObject);
        // ammoDeletePtr(bodyStruct.shape, Ammo.btCompoundShape);
        // ammoDeletePtr(bodyStruct.startTransform, Ammo.btTransform);
        // ammoDeletePtr(bodyStruct.localInertia, Ammo.btVector3);
        // ammoDeletePtr(bodyStruct.worldQuat, Ammo.btQuaternion);
        const key0 = 'KEY' + bodyStruct.id;
        delete BulletInstance.bodyStructs[key0];

        const ghostStruct = this.ghostStruct;
        // // Ammo.destroy(ghostStruct.ghost);
        // // Ammo.destroy(ghostStruct.shape);
        // Ammo.destroy(ghostStruct.worldQuat);
        // ammoDeletePtr(ghostStruct.ghost, Ammo.btCollisionObject);
        // ammoDeletePtr(ghostStruct.shape, Ammo.btCompoundShape);
        // ammoDeletePtr(ghostStruct.worldQuat, Ammo.btQuaternion);
        const key1 = 'KEY' + ghostStruct.id;
        delete BulletInstance.bodyStructs[key1];

        (this.bodyStruct as any) = null;
        (this.ghostStruct as any) = null;
    }

}
