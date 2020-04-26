/**
 * @hidden
 */
export let PhysicsWorld: any;
export let RigidBody: any;

export let BoxShape: any;
export let SphereShape: any;
export let CapsuleShape: any;
export let TrimeshShape: any;
export let CylinderShape: any;
export let ConeShape: any;
export let TerrianShape: any;
export let SimpleShape: any;

export interface IPhysicsWrapperObject {
    world: any,
    body?: any,
    box: any,
    sphere: any,
    capsule?: any,
    trimesh?: any,
    cylinder?: any,
    terrian?: any,
    cone?: any,
    simple?: any,
}

export function instantiate (obj: IPhysicsWrapperObject) {
    BoxShape = obj.box;
    SphereShape = obj.sphere;
    RigidBody = obj.body;
    PhysicsWorld = obj.world;
    if (obj.capsule) { CapsuleShape = obj.capsule; }
    if (obj.trimesh) { TrimeshShape = obj.trimesh; }
    if (obj.cylinder) { CylinderShape = obj.cylinder; }
    if (obj.cone) { ConeShape = obj.cone; }
    if (obj.terrian) { TerrianShape = obj.terrian; }
    if (obj.cone) { ConeShape = obj.cone; }
    if (obj.simple) { SimpleShape = obj.simple; }
}
