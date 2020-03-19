import { BULLET } from './bullet-export';
import { ColliderComponent, TriggerEventType, CollisionEventType, IContactEquation } from '../../../exports/physics-framework';

export const TriggerEventObject = {
    type: 'onTriggerEnter' as unknown as TriggerEventType,
    selfCollider: null as unknown as ColliderComponent,
    otherCollider: null as unknown as ColliderComponent,
};

export const CollisionEventObject = {
    type: 'onCollisionEnter' as CollisionEventType,
    selfCollider: null as unknown as ColliderComponent,
    otherCollider: null as unknown as ColliderComponent,
    contacts: [] as IContactEquation[],
};

export class BulletConstant {
    private static _instance: BulletConstant;
    static get instance () {
        if (BulletConstant._instance == null) BulletConstant._instance = new BulletConstant;
        return BulletConstant._instance;
    }
    // readonly EMPTY_SHAPE = new Ammo.btEmptyShape();
}