import instantiate from '@cocos/bullet';

//asmLibraryArg
var asmLibraryArg = {
    memory: {},
    getWorldTransform: (id: number, transform: number) => { },
    setWorldTransform: (id: number, transform: number) => {
        var v3 = BULLET.btTransform_getOrigin(transform);
        var x = BULLET.btVector3_x(v3);
        var y = BULLET.btVector3_y(v3);
        var z = BULLET.btVector3_z(v3);
        console.log(x, y, z);
    }
};

//memory
var wasmMemory = { buffer: new ArrayBuffer(16 * 1024 * 1024) };

export const BULLET = instantiate(asmLibraryArg, wasmMemory);
window["BULLET"] = BULLET;

// /**
//  * TEST
//  */

// const physics3D = BULLET;
// var COLLISIONFILTERGROUP_DEFAULTFILTER = 0x1;
// var COLLISIONFILTERGROUP_ALLFILTER = -1;
// var ACTIVATIONSTATE_DISABLE_SIMULATION = 5;

// //Add PhysicsSimulation
// var nativeCollisionConfiguration = physics3D.btDefaultCollisionConfiguration_create();
// var nativeDispatcher = physics3D.btCollisionDispatcher_create(nativeCollisionConfiguration);
// var nativeBroadphase = physics3D.btDbvtBroadphase_create();
// var solver = physics3D.btSequentialImpulseConstraintSolver_create();
// var nativeDiscreteDynamicsWorld = physics3D.btDiscreteDynamicsWorld_create(nativeDispatcher, nativeBroadphase, solver, nativeCollisionConfiguration);
// var nativeCollisionWorld = nativeDiscreteDynamicsWorld;
// physics3D.btGImpactCollisionAlgorithm_RegisterAlgorithm(nativeDispatcher);
// physics3D.btDiscreteDynamicsWorld_setGravity(nativeDiscreteDynamicsWorld, physics3D.btVector3_create(0, -98.0, 0));


// //Add  PhysicsCollider: is a Plane  
// var btColObj = physics3D.btCollisionObject_create();
// physics3D.btCollisionObject_forceActivationState(btColObj, ACTIVATIONSTATE_DISABLE_SIMULATION);//prevent simulation
// var planeShape = physics3D.btBoxShape_create(physics3D.btVector3_create(5, 0.1, 5));
// physics3D.btCollisionObject_setCollisionShape(btColObj, planeShape);
// physics3D.btCollisionWorld_addCollisionObject(nativeCollisionWorld, btColObj, COLLISIONFILTERGROUP_DEFAULTFILTER, COLLISIONFILTERGROUP_ALLFILTER);

// //Add  Rigidbody: is a rigidbdoy ball up the plane
// var constructInfo = physics3D.btRigidBodyConstructionInfo_create(0.0, physics3D.LayaMotionState_create(), null, physics3D.btVector3_create(0, 0, 0));
// var btRigid = physics3D.btRigidBody_create(constructInfo);
// physics3D.btRigidBodyConstructionInfo_destroy(constructInfo);

// var radius = 0.2;
// var mass = 10;
// var ballShape = physics3D.btSphereShape_create(radius);
// var nativeInertia = physics3D.btVector3_create(0, 0, 0);
// physics3D.btCollisionObject_setCollisionShape(btRigid, ballShape);
// physics3D.btCollisionShape_calculateLocalInertia(ballShape, mass, nativeInertia);
// physics3D.btRigidBody_setMassProps(btRigid, mass, nativeInertia);
// physics3D.btRigidBody_updateInertiaTensor(btRigid);
// physics3D.btDiscreteDynamicsWorld_addRigidBody(nativeCollisionWorld, btRigid, COLLISIONFILTERGROUP_DEFAULTFILTER, COLLISIONFILTERGROUP_ALLFILTER);

// /**This is the main function not work,"CcdSweptSphereRadius" is a function to prevent penetration as the speed is too fast*************/
// {
//     physics3D.btCollisionObject_setCcdSweptSphereRadius(btRigid, radius);
//     physics3D.btCollisionObject_setCcdMotionThreshold(btRigid, 0.0001);
// }
// /*************************************************************************************************************************************/

// //Let Rigidbody a litte high
// var btRigidTransform = physics3D.btCollisionObject_getWorldTransform(btRigid);
// physics3D.btTransform_setOrigin(btRigidTransform, physics3D.btVector3_create(0, 10, 0));

// //Main loop
// window.requestAnimationFrame(loop);
// function loop() {
//     //update physics simulation
//     physics3D.btDiscreteDynamicsWorld_stepSimulation(nativeDiscreteDynamicsWorld, 1 / 60, 1, 1 / 60);
//     window.requestAnimationFrame(loop);
// }


