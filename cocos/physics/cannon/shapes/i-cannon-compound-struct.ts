import CANNON from '@cocos/cannon';

export interface ICannonCompoundStruct {
    shapes: CANNON.Shape[];
    offsets: CANNON.Vec3[];
    orients: CANNON.Quaternion[];
}