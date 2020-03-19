import { BULLET } from './bullet-export';
import { IVec3Like, IQuatLike } from '../../core/math/type-define';

export function cocos2BulletVec3 (out: number, v: IVec3Like): number {
    BULLET.btVector3_setValue(out, v.x, v.y, v.z);
    return out;
}

export function bullet2CocosVec3<T extends IVec3Like> (out: T, v: number): T {
    out.x = BULLET.btVector3_x(v);
    out.y = BULLET.btVector3_y(v);
    out.z = BULLET.btVector3_z(v);
    return out;
}

export function cocos2BulletQuat (out: number, q: IQuatLike): number {
    BULLET.btQuaternion_setValue(out, q.x, q.y, q.z, q.w);
    return out;
}

export function bullet2CocosQuat<T extends IQuatLike> (out: T, q: number): T {
    out.x = BULLET.btQuaternion_x(q);
    out.y = BULLET.btQuaternion_y(q);
    out.z = BULLET.btQuaternion_z(q);
    out.w = BULLET.btQuaternion_w(q);
    return out;
}
