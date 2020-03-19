import { BULLET } from './bullet-export';
import { Vec3, Node } from "../../core";
import { BulletWorld } from "./bullet-world";
import { cocos2BulletVec3, bullet2CocosVec3 } from "./bullet-util";
import { RigidBodyComponent, PhysicsSystem } from '../../../exports/physics-framework';
import { btCollisionFlags, btRigidBodyFlags, btCollisionObjectStates } from './bullet-enum';
import { IRigidBody } from '../spec/i-rigid-body';
import { ERigidBodyType } from '../framework/physics-enum';
import { BulletSharedBody } from './bullet-shared-body';
import { IVec3Like } from '../../core/math/type-define';

const v3_0 = new Vec3();

export class BulletRigidBody implements IRigidBody {

    get isAwake (): boolean {
        const state = BULLET.btCollisionObject_getActivationState(this.impl);
        return state == btCollisionObjectStates.ACTIVE_TAG ||
            state == btCollisionObjectStates.DISABLE_DEACTIVATION;
    }

    get isSleepy (): boolean {
        const state = BULLET.btCollisionObject_getActivationState(this.impl);
        return state == btCollisionObjectStates.WANTS_DEACTIVATION;
    }

    get isSleeping (): boolean {
        const state = BULLET.btCollisionObject_getActivationState(this.impl);
        return state == btCollisionObjectStates.ISLAND_SLEEPING;
    }

    setMass (value: number) {
        // See https://studiofreya.com/game-maker/bullet-physics/bullet-physics-how-to-change-body-mass/
        const localInertia = this._sharedBody.bodyStruct.localInertia;
        BULLET.btVector3_setValue(localInertia, 1.6666666269302368, 1.6666666269302368, 1.6666666269302368);
        BULLET.btCollisionShape_calculateLocalInertia(this._btCompoundShape, value, localInertia);
        BULLET.btRigidBody_setMassProps(this.impl, value, localInertia);
        BULLET.btRigidBody_updateInertiaTensor(this.impl);
        this._sharedBody.updateByReAdd();
    }

    setLinearDamping (value: number) {
        // this.impl.setDamping(this._rigidBody.linearDamping, this._rigidBody.angularDamping);
    }

    setAngularDamping (value: number) {
        // this.impl.setDamping(this._rigidBody.linearDamping, this._rigidBody.angularDamping);
    }

    setIsKinematic (value: boolean) {
        let m_collisionFlags = BULLET.btCollisionObject_getCollisionFlags(this.impl);
        if (value) {
            m_collisionFlags |= btCollisionFlags.CF_KINEMATIC_OBJECT;
        } else {
            m_collisionFlags &= (~btCollisionFlags.CF_KINEMATIC_OBJECT);
        }
        BULLET.btCollisionObject_setCollisionFlags(this.impl, m_collisionFlags);
    }

    useGravity (value: boolean) {
        let m_rigidBodyFlag = BULLET.btRigidBody_getFlags(this.impl);
        if (value) {
            m_rigidBodyFlag &= (~btRigidBodyFlags.BT_DISABLE_WORLD_GRAVITY);
        } else {
            // this.impl.setGravity(cocos2BulletVec3(this._btVec3_0, Vec3.ZERO));
            m_rigidBodyFlag |= btRigidBodyFlags.BT_DISABLE_WORLD_GRAVITY;
        }
        BULLET.btRigidBody_setFlags(this.impl, m_rigidBodyFlag);
        this._sharedBody.updateByReAdd();
    }

    fixRotation (value: boolean) {
        // if (value) {
        //     /** TODO : should i reset angular velocity & torque ? */

        //     this.impl.setAngularFactor(cocos2BulletVec3(this._btVec3_0, Vec3.ZERO));
        // } else {
        //     this.impl.setAngularFactor(cocos2BulletVec3(this._btVec3_0, this._rigidBody.angularFactor));
        // }
    }

    setLinearFactor (value: IVec3Like) {
        // this.impl.setLinearFactor(cocos2BulletVec3(this._btVec3_0, value));
    }

    setAngularFactor (value: IVec3Like) {
        // this.impl.setAngularFactor(cocos2BulletVec3(this._btVec3_0, value));
    }

    setAllowSleep (v: boolean) {
        // if (v) {
        //     const state = this.impl.getActivationState();
        //     if (state == btCollisionObjectStates.DISABLE_DEACTIVATION) {
        //         this.impl.setActivationState(btCollisionObjectStates.ACTIVE_TAG);
        //     }
        // } else {
        //     this.impl.setActivationState(btCollisionObjectStates.DISABLE_DEACTIVATION);
        // }
    }

    get isEnabled () { return this._isEnabled; }
    get impl () { return this._sharedBody.body; }
    get rigidBody () { return this._rigidBody; }

    private static idCounter = 0;
    readonly id: number;

    private _isEnabled = false;
    private _sharedBody!: BulletSharedBody;
    private _rigidBody!: RigidBodyComponent;
    private get _btCompoundShape () { return this._sharedBody.bodyCompoundShape };

    private _btVec3_0 = BULLET.btVector3_create(0, 0, 0);
    private _btVec3_1 = BULLET.btVector3_create(0, 0, 0);

    constructor () {
        this.id = BulletRigidBody.idCounter++;
    }

    /** LIFECYCLE */

    initialize (com: RigidBodyComponent) {
        this._rigidBody = com;
        this._sharedBody = (PhysicsSystem.instance.physicsWorld as BulletWorld).getSharedBody(this._rigidBody.node as Node, this);
        this._sharedBody.reference = true;
    }

    onEnable () {
        this._isEnabled = true;
        this.setMass(this._rigidBody.mass);
        // this.setAllowSleep(this._rigidBody.allowSleep);
        // this.setLinearDamping(this._rigidBody.linearDamping);
        // this.setAngularDamping(this._rigidBody.angularDamping);
        // this.setIsKinematic(this._rigidBody.isKinematic);
        // this.fixRotation(this._rigidBody.fixedRotation);
        // this.setLinearFactor(this._rigidBody.linearFactor);
        // this.setAngularFactor(this._rigidBody.angularFactor);
        // this.useGravity(this._rigidBody.useGravity);
        this._sharedBody.bodyEnabled = true;
    }

    onDisable () {
        this._isEnabled = false;
        this._sharedBody.bodyEnabled = false;
    }

    onDestroy () {
        this._sharedBody.reference = false;
        (this._rigidBody as any) = null;
        (this._sharedBody as any) = null;
    }

    /** INTERFACE */

    wakeUp (force?: boolean): void {
        // this.impl.activate(force);
    }

    sleep (): void {
        // return this.impl.wantsSleeping() as any;
    }

    /** type */

    getType (): ERigidBodyType {
        // if (this.impl.isStaticOrKinematicObject()) {
        //     if (this.impl.isKinematicObject()) {
        //         return ERigidBodyType.KINEMATIC
        //     } else {
        //         return ERigidBodyType.STATIC
        //     }
        // } else {
        //     return ERigidBodyType.DYNAMIC
        // }
        return ERigidBodyType.DYNAMIC
    }

    /** kinematic */

    getLinearVelocity (out: Vec3): Vec3 {
        return bullet2CocosVec3(out, BULLET.btRigidBody_getLinearVelocity(this.impl));
    }

    setLinearVelocity (value: Vec3): void {
        cocos2BulletVec3(BULLET.btRigidBody_getLinearVelocity(this.impl), value);
    }

    getAngularVelocity (out: Vec3): Vec3 {
        return bullet2CocosVec3(out, BULLET.btRigidBody_getAngularVelocity(this.impl));
    }

    setAngularVelocity (value: Vec3): void {
        cocos2BulletVec3(BULLET.btRigidBody_setAngularVelocity(this.impl), value);
    }

    /** dynamic */

    applyLocalForce (force: Vec3, rel_pos?: Vec3): void {
        const rp = rel_pos ? Vec3.transformQuat(v3_0, rel_pos, this._sharedBody.node.worldRotation) : Vec3.ZERO;
        cocos2BulletVec3(this._btVec3_0, force);
        cocos2BulletVec3(this._btVec3_1, rp);
        BULLET.btRigidBody_applyForce(this.impl, this._btVec3_0, this._btVec3_1);
    }

    applyLocalTorque (torque: Vec3): void {
        Vec3.transformQuat(v3_0, torque, this._sharedBody.node.worldRotation);
        cocos2BulletVec3(this._btVec3_0, v3_0)
        BULLET.btRigidBody_applyTorque(this.impl, this._btVec3_0);
    }

    applyLocalImpulse (impulse: Vec3, rel_pos?: Vec3): void {
        const rp = rel_pos ? Vec3.transformQuat(v3_0, rel_pos, this._sharedBody.node.worldRotation) : Vec3.ZERO;
        cocos2BulletVec3(this._btVec3_0, impulse);
        cocos2BulletVec3(this._btVec3_1, rp);
        BULLET.btRigidBody_applyImpulse(this.impl, this._btVec3_0, this._btVec3_1);
    }

    applyForce (force: Vec3, rel_pos?: Vec3): void {
        const rp = rel_pos ? rel_pos : Vec3.ZERO;
        cocos2BulletVec3(this._btVec3_0, force);
        cocos2BulletVec3(this._btVec3_1, rp);
        BULLET.btRigidBody_applyForce(this.impl, this._btVec3_0, this._btVec3_1);
    }

    applyTorque (torque: Vec3): void {
        cocos2BulletVec3(this._btVec3_0, torque);
        BULLET.btRigidBody_applyTorque(this.impl, this._btVec3_0);
    }

    applyImpulse (impulse: Vec3, rel_pos?: Vec3): void {
        const rp = rel_pos ? rel_pos : Vec3.ZERO;
        cocos2BulletVec3(this._btVec3_0, impulse);
        cocos2BulletVec3(this._btVec3_1, rp);
        BULLET.btRigidBody_applyImpulse(this.impl, this._btVec3_0, this._btVec3_1);
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

}
