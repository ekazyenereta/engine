import { BULLET } from './../bullet-export';
import { Vec3, Quat } from "../../../core/math";
import { ColliderComponent, RigidBodyComponent, PhysicMaterial, PhysicsSystem } from "../../../../exports/physics-framework";
import { BulletWorld } from '../bullet-world';
import { btBroadphaseNativeTypes } from '../bullet-enum';
import { cocos2BulletVec3 } from '../bullet-util';
import { Node } from '../../../core';
import { IBaseShape } from '../../spec/i-physics-shape';
import { IVec3Like } from '../../../core/math/type-define';
import { BulletSharedBody } from '../bullet-shared-body';

const v3_0 = new Vec3();

export class BulletShape implements IBaseShape {

    setMaterial (v: PhysicMaterial | null) {
        if (!this._isTrigger && this._isEnabled && v) {
            // if (this._btCompound) {
            //     const rollingFriction = 0.1;
            //     this._btCompound.setMaterial(this._index, v.friction, v.restitution, rollingFriction);
            // } else {
            //     this._sharedBody.body.setFriction(v.friction);
            //     this._sharedBody.body.setRestitution(v.restitution);
            // }
        }
    }

    setCenter (v: IVec3Like) {
        Vec3.copy(v3_0, v);
        v3_0.multiply(this._collider.node.worldScale);
        cocos2BulletVec3(BULLET.btTransform_getOrigin(this.transform), v3_0);
        if (this._btCompound) {
            BULLET.btCompoundShape_updateChildTransform(this._btCompound, this._index, this.transform);
        }
    }

    setAsTrigger (v: boolean) {
        if (this._isTrigger == v)
            return;

        if (this._isEnabled) {
            this._sharedBody.removeShape(this, !v);
            this._sharedBody.addShape(this, v);
        }
        this._isTrigger = v;
    }

    get attachedRigidBody () {
        if (this._sharedBody.wrappedBody) { return this._sharedBody.wrappedBody.rigidBody; }
        return null;
    }

    get impl () { return this._btShape!; }
    get collider (): ColliderComponent { return this._collider; }
    get sharedBody (): BulletSharedBody { return this._sharedBody; }
    get index () { return this._index; }

    private static idCounter = 0;
    readonly id: number;
    readonly type: btBroadphaseNativeTypes;

    protected _index: number = -1;
    protected _isEnabled = false;
    protected _isBinding = false;
    protected _isTrigger = false;
    protected _sharedBody!: BulletSharedBody;
    protected _btShape!: number;
    protected _btCompound: number | null = null;
    protected _collider!: ColliderComponent;

    readonly transform: number;
    readonly pos: number;
    readonly quat: number;
    readonly scale: number;

    constructor (type: btBroadphaseNativeTypes) {
        this.type = type;
        this.id = BulletShape.idCounter++;

        this.pos = BULLET.btVector3_create(0., 0., 0.);
        this.quat = BULLET.btQuaternion_create(0., 0., 0., 1.);
        this.transform = BULLET.btTransform_create2(this.pos, this.quat);

        this.scale = BULLET.btVector3_create(1, 1, 1);
    }

    initialize (com: ColliderComponent) {
        this._collider = com;
        this._isBinding = true;
        this.onComponentSet();
        this.setWrapper();
        this._sharedBody = (PhysicsSystem.instance.physicsWorld as BulletWorld).getSharedBody(this._collider.node as Node);
        this._sharedBody.reference = true;
    }

    // virtual
    onComponentSet () { }

    onLoad () {
        this.setCenter(this._collider.center);
        this.setAsTrigger(this._collider.isTrigger);
    }

    onEnable () {
        this._isEnabled = true;
        this._sharedBody.addShape(this, this._isTrigger);

        this.setMaterial(this.collider.sharedMaterial);
    }

    onDisable () {
        this._isEnabled = false;
        this._sharedBody.removeShape(this, this._isTrigger);
    }

    onDestroy () {
        this._sharedBody.reference = false;
        this._btCompound = null;
        (this._collider as any) = null;
        // const shape = Ammo.castObject(this._btShape, Ammo.btCollisionShape);
        // shape.wrapped = null;
        // Ammo.destroy(this.transform);
        // Ammo.destroy(this.pos);
        // Ammo.destroy(this.quat);
        // Ammo.destroy(this.scale);
        // Ammo.destroy(this._btShape);
        // ammoDeletePtr(this.pos, Ammo.btVector3);
        // ammoDeletePtr(this.quat, Ammo.btQuaternion);
        // ammoDeletePtr(this.scale, Ammo.btVector3);
        // ammoDeletePtr(this.transform, Ammo.btTransform);
        // ammoDeletePtr(this._btShape, Ammo.btCollisionShape);
        (this._btShape as any) = null;
        (this.transform as any) = null;
        (this.pos as any) = null;
        (this.quat as any) = null;
        (this.scale as any) = null;
    }

    /** group mask */
    getGroup (): number {
        return this._sharedBody.collisionFilterGroup;
    }

    setGroup (v: number): void {
        this._sharedBody.collisionFilterGroup = v;
    }

    addGroup (v: number): void {
        this._sharedBody.collisionFilterGroup |= v;
    }

    removeGroup (v: number): void {
        this._sharedBody.collisionFilterGroup &= ~v;
    }

    getMask (): number {
        return this._sharedBody.collisionFilterMask;
    }

    setMask (v: number): void {
        this._sharedBody.collisionFilterMask = v;
    }

    addMask (v: number): void {
        this._sharedBody.collisionFilterMask |= v;
    }

    removeMask (v: number): void {
        this._sharedBody.collisionFilterMask &= ~v;
    }

    setCompound (compound: number | null) {
        if (this._btCompound) {
            BULLET.btCompoundShape_removeChildShapeByIndex(this._btCompound, this._index);
            this._index = -1;
        }
        if (compound != null) {
            BULLET.btCompoundShape_addChildShape(this._btCompound, this.transform, this._btShape);
            this._index = BULLET.btCompoundShape_getNumChildShapes(this._btCompound) - 1;
        }
        this._btCompound = compound;
    }

    setWrapper () {
        // const shape = Ammo.castObject(this._btShape, Ammo.btCollisionShape);
        // shape.wrapped = this;
    }

    updateScale () {
        this.setCenter(this._collider.center);
    }

    /**DEBUG */
    private static _debugTransform: number;
    debugTransform (n: Node) {
        // if (BulletShape._debugTransform == null) {
        //     BulletShape._debugTransform = BULLET.btTransform();
        // }
        // let wt: number;
        // if (this._isTrigger) {
        //     wt = this._sharedBody.ghost.getWorldTransform();
        // } else {
        //     wt = this._sharedBody.body.getWorldTransform();
        // }
        // const lt = this.transform;
        // BulletShape._debugTransform.setIdentity();
        // BulletShape._debugTransform.op_mul(wt).op_mul(lt);
        // let origin = BulletShape._debugTransform.getOrigin();
        // n.worldPosition = new Vec3(origin.x(), origin.y(), origin.z());
        // let rotation = BulletShape._debugTransform.getRotation();
        // n.worldRotation = new Quat(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        // let scale = this.impl.getLocalScaling();
        // n.scale = new Vec3(scale.x(), scale.y(), scale.z());
    }
}
