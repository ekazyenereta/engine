/**
 * @category physics
 */

import { Vec3 } from '../../core/math';
import { IPhysicsWorld, IRaycastOptions } from '../spec/i-physics-world';
import { createPhysicsWorld, checkPhysicsModule } from './instance';
import { director, Director } from '../../core/director';
import { System } from '../../core/components';
import { PhysicMaterial } from './assets/physic-material';
import { Layers, RecyclePool, error } from '../../core';
import { ray } from '../../core/geometry';
import { PhysicsRayResult } from './physics-ray-result';
import { EDITOR, PHYSICS_BUILTIN, DEBUG, PHYSICS_CANNON, PHYSICS_AMMO } from 'internal:constants';
import { IPhysicsConfig, ICollisionMatrix } from './physics-config';

class CollisionMatrix {

    updateArray: number[] = [];

    constructor () {
        for (let i = 0; i < 32; i++) {
            const key = 1 << i;
            this[`_${key}`] = 0xffffffff;
            Object.defineProperty(this, key, {
                'get': function () { return this[`_${key}`] },
                'set': function (v: number) {
                    const self = this as CollisionMatrix;
                    if (self[`_${key}`] != v) {
                        self[`_${key}`] = v;
                        if (self.updateArray.indexOf(key) < 0) {
                            self.updateArray.push(key);
                        }
                    }
                }
            })
        }
    }
}

/**
 * @en
 * Physics system.
 * @zh
 * 物理系统。
 */
export class PhysicsSystem extends System {

    /**
     * @en
     * Gets or sets whether the physical system is enabled, which can be used to pause or continue running the physical system.
     * @zh
     * 获取或设置是否启用物理系统，可以用于暂停或继续运行物理系统。
     */
    get enable (): boolean {
        return this._enable;
    }
    set enable (value: boolean) {
        if (!value) this._timeReset = true;
        this._enable = value;
    }

    /**
     * @zh
     * Gets or sets whether the physical system allows automatic sleep, which defaults to true.
     * @zh
     * 获取或设置物理系统是否允许自动休眠，默认为 true。
     */
    get allowSleep (): boolean {
        return this._allowSleep;
    }
    set allowSleep (v: boolean) {
        this._allowSleep = v;
        if (!EDITOR) {
            this.physicsWorld.setAllowSleep(v);
        }
    }

    /**
     * @en
     * Gets or sets the maximum number of simulated substeps per frame.
     * @zh
     * 获取或设置每帧模拟的最大子步数。
     */
    get maxSubSteps () {
        return this._maxSubSteps;
    }

    set maxSubSteps (value: number) {
        this._maxSubSteps = value;
    }

    /**
     * @en
     * Gets or sets the fixed delta time consumed by each simulation step.
     * @zh
     * 获取或设置每步模拟消耗的固定时间。
     */
    get fixedTimeStep () {
        return this._fixedTimeStep;
    }

    set fixedTimeStep (value: number) {
        this._fixedTimeStep = value;
    }

    /**
     * @en
     * Gets or sets the value of gravity in the physical world, which defaults to (0, -10, 0).
     * @zh
     * 获取或设置物理世界的重力数值，默认为 (0, -10, 0)。
     */
    get gravity (): Vec3 {
        return this._gravity;
    }
    set gravity (gravity: Vec3) {
        this._gravity.set(gravity);
        if (!EDITOR) {
            this.physicsWorld.setGravity(gravity);
        }
    }

    /**
     * @en
     * Gets the global default physical material.
     * @zh
     * 获取全局的默认物理材质。
     */
    get defaultMaterial (): PhysicMaterial {
        return this._material;
    }

    /**
     * @en
     * Gets the wrappered object of the physical world through which you can access the actual underlying object.
     * @zh
     * 获取物理世界的封装对象，通过它你可以访问到实际的底层对象。
     */
    readonly physicsWorld: IPhysicsWorld;

    /**
     * @en
     * Gets the raycastClosest test result.
     * @zh
     * 获取 raycastClosest 的检测结果。
     */
    readonly raycastClosestResult = new PhysicsRayResult();

    /**
     * @en
     * Gets the raycast test results.
     * @zh
     * 获取 raycast 的检测结果。
     */
    readonly raycastResults: PhysicsRayResult[] = [];

    readonly collisionMatrix: ICollisionMatrix = new CollisionMatrix() as unknown as ICollisionMatrix;

    autoSimulation: boolean = true;

    readonly useCollisionMatrix: boolean;

    readonly useNodeChains: boolean;

    /**
     * @en
     * Gets the ID of the system.
     * @zh
     * 获取此系统的ID。
     */
    static readonly ID = 'PHYSICS';

    // static readonly CONFIG = globalThis._CCSettings ? globalThis._CCSettings.physics : null;
    static readonly CONFIG = globalThis.__PHYSICS__;

    /**
     * @en
     * Gets the physical system instance.
     * @zh
     * 获取物理系统实例。
     */
    static get instance (): PhysicsSystem {
        if (DEBUG && checkPhysicsModule(PhysicsSystem._instance)) { return null as any; }
        return PhysicsSystem._instance;
    }

    private static readonly _instance: PhysicsSystem;

    private _enable = true;
    private _allowSleep = true;
    private _maxSubSteps = 1;
    private _fixedTimeStep = 1.0 / 60.0;
    private _timeSinceLastCalled = 0;
    private _timeReset = true;
    private _accumulator = 0;
    private readonly _gravity = new Vec3(0, -10, 0);
    private readonly _material = new PhysicMaterial();

    private readonly raycastOptions: IRaycastOptions = {
        'group': -1,
        'mask': -1,
        'queryTrigger': true,
        'maxDistance': 10000000
    }

    private readonly raycastResultPool = new RecyclePool<PhysicsRayResult>(() => {
        return new PhysicsRayResult();
    }, 1);

    private constructor () {
        super();
        let config = PhysicsSystem.CONFIG as IPhysicsConfig;
        if (config) {
            Vec3.copy(this._gravity, config.gravity);
            this._allowSleep = config.allowSleep;
            this._fixedTimeStep = config.fixedTimeStep;
            this._maxSubSteps = config.maxSubSteps;
            this.autoSimulation = config.autoSimulation;
            this.useNodeChains = config.useNodeChains;
            this.useCollisionMatrix = config.useCollsionMatrix;

            if (config.defaultMaterial) {
                this._material.friction = config.defaultMaterial.friction;
                this._material.rollingFriction = config.defaultMaterial.rollingFriction;
                this._material.spinningFriction = config.defaultMaterial.spinningFriction;
                this._material.restitution = config.defaultMaterial.restitution;
            }

            if (config.collisionMatrix) {
                for (const key in config.collisionMatrix) {
                    this.collisionMatrix[`_${key}`] = config.collisionMatrix[key];
                }
            }
        } else {
            this.useCollisionMatrix = true;
            this.useNodeChains = true;
        }
        this._material.on('physics_material_update', this._updateMaterial, this);

        this.physicsWorld = createPhysicsWorld();
        this.physicsWorld.setGravity(this._gravity);
        this.physicsWorld.setAllowSleep(this._allowSleep);
        this.physicsWorld.setDefaultMaterial(this._material);
    }

    /**
     * @en
     * The lifecycle function is automatically executed after all components `update` and `lateUpadte` are executed.
     * @zh
     * 生命周期函数，在所有组件的`update`和`lateUpadte`执行完成后自动执行。
     * @param deltaTime the time since last frame.
     */
    postUpdate (deltaTime: number) {
        if (EDITOR && !this._executeInEditMode) {
            return;
        }

        if (!this._enable) {
            this.physicsWorld.syncSceneToPhysics();
            return;
        }

        if (this.autoSimulation) {
            if (this._timeReset) {
                this._timeSinceLastCalled = 0;
                this._timeReset = false;
            } else {
                this._timeSinceLastCalled = deltaTime;
            }

            director.emit(Director.EVENT_BEFORE_PHYSICS);
            let i = 0;
            this._accumulator += this._timeSinceLastCalled;
            while (i < this._maxSubSteps && this._accumulator > this._fixedTimeStep) {
                this.physicsWorld.emitEvents();
                this.updateCollisionMatrix();
                this.physicsWorld.syncSceneToPhysics();
                this.physicsWorld.step(this._fixedTimeStep);
                // TODO: nesting the dirty flag reset between the syncScenetoPhysics and the simulation to reduce calling syncScenetoPhysics.
                this.physicsWorld.syncSceneToPhysics();
                this._accumulator -= this._fixedTimeStep;
                i++;
            }
            director.emit(Director.EVENT_AFTER_PHYSICS);
        }
    }

    /**
     * @en
     * Perform simulation steps for the physics world.
     * @zh
     * 执行物理世界的模拟步进。
     * @param fixedTimeStep
     */
    step (fixedTimeStep: number, deltaTime?: number, maxSubSteps?: number) {
        this.physicsWorld.step(fixedTimeStep, deltaTime, maxSubSteps);
    }

    /**
     * @en
     * Sync the scene world transform changes to the physics world.
     * @zh
     * 同步场景世界的变化信息到物理世界中。
     */
    syncSceneToPhysics () {
        this.physicsWorld.syncSceneToPhysics();
    }

    /**
     * @en
     * Emit trigger and collision events.
     * @zh
     * 触发`trigger`和`collision`事件。
     */
    emitEvents () {
        this.physicsWorld.emitEvents();
    }

    /**
     * @en
     * Updates the mask corresponding to the collision matrix for the lowLevel rigid-body instance.
     * Automatic execution during automatic simulation.
     * @zh
     * 更新底层实例对应于碰撞矩阵的掩码，自动模拟时会自动更新。
     */
    updateCollisionMatrix () {
        if (this.useCollisionMatrix) {
            const ua = (this.collisionMatrix as unknown as CollisionMatrix).updateArray;
            while (ua.length > 0) {
                const group = ua.pop()!;
                const mask = this.collisionMatrix[group];
                this.physicsWorld.updateCollisionMatrix(group, mask);
            }
        }
    }

    /**
     * @en
     * Reset the mask corresponding to all groups of the collision matrix to the given value, the default given value is' 0xffffffff '.
     * @zh
     * 重置碰撞矩阵所有分组对应掩码为给定值，默认给定值为`0xffffffff`。
     */
    resetCollisionMatrix (mask = 0xffffffff) {
        for (let i = 0; i < 32; i++) {
            const key = 1 << i;
            this[`${key}`] = 0xffffffff;
        }
    }

    /**
     * @en
     * Are collisions between `group1` and `group2`?
     * @zh
     * 两分组是否会产生碰撞？
     */
    isCollisionGroup (group1: number, group2: number) {
        const cm = this.collisionMatrix;
        const mask1 = cm[group1];
        const mask2 = cm[group2];
        if (DEBUG) {
            if (mask1 == undefined || mask2 == undefined) {
                error("[PHYSICS]: 'isCollisionGroup', the group do not exist in the collision matrix.");
                return false;
            }
        }
        return (group1 & mask2) && (group2 & mask1);
    }

    /**
     * @en
     * Sets whether collisions occur between `group1` and `group2`.
     * @zh
     * 设置两分组间是否产生碰撞。
     * @param collision is collision occurs?
     */
    setCollisionGroup (group1: number, group2: number, collision: boolean = true) {
        const cm = this.collisionMatrix;
        if (DEBUG) {
            if (cm[group1] == undefined || cm[group2] == undefined) {
                error("[PHYSICS]: 'setCollisionGroup', the group do not exist in the collision matrix.");
                return;
            }
        }
        if (collision) {
            cm[group1] |= group2;
            cm[group2] |= group1;
        } else {
            cm[group1] &= ~group2;
            cm[group2] &= ~group1;
        }
    }

    /**
     * @en
     * Collision detect all collider, and record all the detected results, through PhysicsSystem.Instance.RaycastResults access to the results.
     * @zh
     * 检测所有的碰撞盒，并记录所有被检测到的结果，通过 PhysicsSystem.instance.raycastResults 访问结果。
     * @param worldRay 世界空间下的一条射线
     * @param mask 掩码，默认为 0xffffffff
     * @param maxDistance 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
     * @param queryTrigger 是否检测触发器
     * @return boolean 表示是否有检测到碰撞盒
     */
    raycast (worldRay: ray, mask: number = 0xffffffff, maxDistance = 10000000, queryTrigger = true): boolean {
        this.raycastResultPool.reset();
        this.raycastResults.length = 0;
        this.raycastOptions.mask = mask;
        this.raycastOptions.maxDistance = maxDistance;
        this.raycastOptions.queryTrigger = queryTrigger;
        return this.physicsWorld.raycast(worldRay, this.raycastOptions, this.raycastResultPool, this.raycastResults);
    }

    /**
     * @en
     * Collision detect all collider, and record and ray test results with the shortest distance by PhysicsSystem.Instance.RaycastClosestResult access to the results.
     * @zh
     * 检测所有的碰撞盒，并记录与射线距离最短的检测结果，通过 PhysicsSystem.instance.raycastClosestResult 访问结果。
     * @param worldRay 世界空间下的一条射线
     * @param mask 掩码，默认为 0xffffffff
     * @param maxDistance 最大检测距离，默认为 10000000，目前请勿传入 Infinity 或 Number.MAX_VALUE
     * @param queryTrigger 是否检测触发器
     * @return boolean 表示是否有检测到碰撞盒
     */
    raycastClosest (worldRay: ray, mask: number = 0xffffffff, maxDistance = 10000000, queryTrigger = true): boolean {
        this.raycastOptions.mask = mask;
        this.raycastOptions.maxDistance = maxDistance;
        this.raycastOptions.queryTrigger = queryTrigger;
        return this.physicsWorld.raycastClosest(worldRay, this.raycastOptions, this.raycastClosestResult);
    }

    private _updateMaterial () {
        this.physicsWorld.setDefaultMaterial(this._material);
    }
}

if (PHYSICS_BUILTIN || PHYSICS_CANNON || PHYSICS_AMMO) {
    director.on(Director.EVENT_INIT, function () {
        const sys = new cc.PhysicsSystem();
        cc.PhysicsSystem._instance = sys;
        director.registerSystem(PhysicsSystem.ID, sys, 0);
    });
}
