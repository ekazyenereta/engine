import * as OIMO from '@cocos/oimo';
import { Quat, Vec3 } from '../../core/math';
import { ERigidBodyType } from '../framework/physics-enum';
import { getWrap } from '../framework/util';
import { OimoWorld } from './oimo-world';
import { OimoShape } from './shapes/oimo-shape';
import { ColliderComponent } from '../../../exports/physics-framework';
import { TransformBit } from '../../core/scene-graph/node-enum';
import { Node } from '../../core';
import { CollisionEventType } from '../framework/physics-interface';
import { OimoRigidBody } from './oimo-rigid-body';

const v3_0 = new Vec3();
const quat_0 = new Quat();
const contactsPool = [] as any;
const CollisionEventObject = {
    type: 'onCollisionEnter' as CollisionEventType,
    selfCollider: null as ColliderComponent | null,
    otherCollider: null as ColliderComponent | null,
    contacts: [] as any,
};

/**
 * sharedbody, node : sharedbody = 1 : 1
 * static
 */
export class OimoSharedBody {

    private static readonly sharedBodesMap = new Map<string, OimoSharedBody>();

    static getSharedBody (node: Node, wrappedWorld: OimoWorld) {
        const key = node.uuid;
        if (OimoSharedBody.sharedBodesMap.has(key)) {
            return OimoSharedBody.sharedBodesMap.get(key)!;
        } else {
            const newSB = new OimoSharedBody(node, wrappedWorld);
            OimoSharedBody.sharedBodesMap.set(node.uuid, newSB);
            return newSB;
        }
    }

    readonly node: Node;
    readonly wrappedWorld: OimoWorld;
    readonly body: OIMO.RigidBody = new OIMO.RigidBody();
    readonly shapes: OimoShape[] = [];
    wrappedBody: OimoRigidBody | null = null;

    private index: number = -1;
    private ref: number = 0;
    private onCollidedListener = this.onCollided.bind(this);

    /**
     * add or remove from world \
     * add, if enable \
     * remove, if disable & shapes.length == 0 & wrappedBody disable
     */
    set enabled (v: boolean) {
        if (v) {
            if (this.index < 0) {
                this.index = this.wrappedWorld.bodies.length;
                this.wrappedWorld.addSharedBody(this);
                this.syncInitial();
            }
        } else {
            if (this.index >= 0) {
                // TODO: 待查，组件的 enabledInHierarchy 为什么还是 true
                const isRemove = (this.shapes.length == 0 && this.wrappedBody == null) ||
                    (this.shapes.length == 0 && this.wrappedBody != null && !this.wrappedBody.rigidBody.enabledInHierarchy) ||
                    (this.shapes.length == 0 && this.wrappedBody != null && !this.wrappedBody.isEnabled)

                if (isRemove) {
                    this.body.sleep(); // clear velocity etc.
                    this.index = -1;
                    this.wrappedWorld.removeSharedBody(this);
                }
            }
        }
    }

    set reference (v: boolean) {
        v ? this.ref++ : this.ref--;
        if (this.ref == 0) { this.destroy(); }
    }

    private constructor (node: Node, wrappedWorld: OimoWorld) {
        this.wrappedWorld = wrappedWorld;
        this.node = node;
        // this.body.material = this.wrappedWorld.world.defaultMaterial;
        // this.body.addEventListener('collide', this.onCollidedListener);
    }

    addShape (v: OimoShape) {
        const index = this.shapes.indexOf(v);
        if (index < 0) {
            const index = this.body.shapes.length;
            this.body.addShape(v.shape);
            this.shapes.push(v);

            v.setIndex(index);
            // const offset = this.body.shapeOffsets[index];
            // const orient = this.body.shapeOrientations[index];
            // v.setOffsetAndOrient(offset, orient);
        }
    }

    removeShape (v: OimoShape) {
        const index = this.shapes.indexOf(v);
        if (index >= 0) {
            this.shapes.splice(index, 1);
            this.body.removeShape(v.shape);

            v.setIndex(-1);
        }
    }

    syncSceneToPhysics () {
        if (this.node.hasChangedFlags) {

            Vec3.copy(this.body.position, this.node.worldPosition);
            Quat.copy(this.body.quaternion, this.node.worldRotation);

            if (this.node.hasChangedFlags & TransformBit.SCALE) {
                for (let i = 0; i < this.shapes.length; i++) {
                    this.shapes[i].setScale(this.node.worldScale);
                }
            }

            // if (this.body.isSleeping()) {
            //     this.body.wakeUp();
            // }
        }
    }

    syncPhysicsToScene () {
        if (this.body.type != ERigidBodyType.STATIC) {
            Vec3.copy(v3_0, this.body.position);
            Quat.copy(quat_0, this.body.quaternion);
            this.node.worldPosition = v3_0;
            this.node.worldRotation = quat_0;
        }
    }

    syncInitial () {
        Vec3.copy(this.body.position, this.node.worldPosition);
        Quat.copy(this.body.quaternion, this.node.worldRotation);

        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].setScale(this.node.worldScale);
        }

        // if (this.body.isSleeping()) {
        //     this.body.wakeUp();
        // }
    }

    private destroy () {
        OimoSharedBody.sharedBodesMap.delete(this.node.uuid);
        (this.node as any) = null;
        (this.wrappedWorld as any) = null;
        (this.body as any) = null;
        (this.shapes as any) = null;
        (this.onCollidedListener as any) = null;
    }

    private onCollided (event: CANNON.ICollisionEvent) {
        CollisionEventObject.type = event.event;
        const self = getWrap<OimoShape>(event.selfShape);
        const other = getWrap<OimoShape>(event.otherShape);

        if (self) {
            CollisionEventObject.selfCollider = self.collider;
            CollisionEventObject.otherCollider = other ? other.collider : null;
            let i = 0;
            for (i = CollisionEventObject.contacts.length; i--;) {
                contactsPool.push(CollisionEventObject.contacts.pop());
            }

            for (i = 0; i < event.contacts.length; i++) {
                const cq = event.contacts[i];
                if (contactsPool.length > 0) {
                    const c = contactsPool.pop();
                    Vec3.copy(c.contactA, cq.ri);
                    Vec3.copy(c.contactB, cq.rj);
                    Vec3.copy(c.normal, cq.ni);
                    CollisionEventObject.contacts.push(c);
                } else {
                    const c = {
                        contactA: Vec3.copy(new Vec3(), cq.ri),
                        contactB: Vec3.copy(new Vec3(), cq.rj),
                        normal: Vec3.copy(new Vec3(), cq.ni),
                    };
                    CollisionEventObject.contacts.push(c);
                }
            }

            for (i = 0; i < this.shapes.length; i++) {
                const shape = this.shapes[i];
                shape.collider.emit(CollisionEventObject.type, CollisionEventObject);

                // if (self.collider.node.hasChangedFlags) {
                //     self.sharedBody.syncSceneToPhysics();
                // }

                // if (other.collider.node.hasChangedFlags) {
                //     other.sharedBody.syncSceneToPhysics();
                // }
            }
        }
    }

}