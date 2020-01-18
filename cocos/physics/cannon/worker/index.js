// window.useWorker = true;
// window.physicsWorkerPath = './worker/index.js';

importScripts('./cannon.min.js');

var world;
var args;
var mapBodies = {};
var nonStaticObject = [];
var mapShapes = {};
var mapMaterial = {};
var isStart = false;

onmessage = function (ev) {
    var func = ev.data.func;
    if (func == 'new') {
        var type = ev.data.type;
        switch (type) {
            case 'World':
                world = new CANNON.World();
                world.gravity.y = -10;
                world.defaultMaterial.friction = 0.1;
                world.defaultMaterial.restitution = 0.1;
                break;

            case 'Box':
                args = ev.data.args;
                mapShapes[ev.data.id] = new CANNON.Box(new CANNON.Vec3(args[0].x, args[0].y, args[0].z));
                break;

            case 'Sphere':
                args = ev.data.args;
                mapShapes[ev.data.id] = new CANNON.Sphere(args[0]);
                break;

            case 'Body':
                mapBodies[ev.data.id] = new CANNON.Body();
                mapBodies[ev.data.id].uuid = ev.data.id;
                break;

            case 'Material':
                mapMaterial[ev.data.id] = new CANNON.Material();
                break;

            case 'NaiveBroadphase':
                world.broadphase = new CANNON.NaiveBroadphase();
                break;

        }
    } else {
        if (func == 'World') {
            var world_op = ev.data.op;
            if (world_op == 'step') {
                if (isStart == false) {
                    isStart = true;
                    for (let i = 0; i < nonStaticObject.length; i++) {
                        const body = nonStaticObject[i];
                        body.updateMassProperties();
                        body.updateBoundingRadius();
                        body.aabbNeedsUpdate = true;
                    }
                    this.setInterval(() => {
                        world.step(1 / 60);
                        world.emitTriggeredEvents();
                        world.emitCollisionEvents();
                        var data = {
                            'func': 'sync_physics',
                            'data': []
                        };
                        for (let i = 0; i < nonStaticObject.length; i++) {
                            const body = nonStaticObject[i];
                            data.data[i] = {
                                id: body.uuid,
                                quat: body.quaternion,
                                pos: body.position
                            };
                        }
                        postMessage(data);
                    }, 1000 / 60);
                }
            } else if (world_op == 'addBody') {
                world.addBody(mapBodies[ev.data.args[0]]);
            } else if (world_op == 'remove') {
                world.remove(mapBodies[ev.data.args[0]]);
            }
        } else {
            switch (func) {
                case 'Body':
                    var body_op = ev.data.op;
                    if (body_op == 'syncInitial') {
                        var body = mapBodies[ev.data.id];
                        body.position.x = ev.data.args[0].x;
                        body.position.y = ev.data.args[0].y;
                        body.position.z = ev.data.args[0].z;
                        body.quaternion.x = ev.data.args[1].x;
                        body.quaternion.y = ev.data.args[1].y;
                        body.quaternion.z = ev.data.args[1].z;
                        body.quaternion.w = ev.data.args[1].w;
                    } else if (body_op == 'updateHasTrigger') {
                        mapBodies[ev.data.id].updateHasTrigger();
                    } else if (body_op == 'updateMassProperties') {
                        mapBodies[ev.data.id].updateMassProperties();
                    } else if (body_op == 'updateBoundingRadius') {
                        mapBodies[ev.data.id].updateBoundingRadius();
                    } else if (body_op == 'addShape') {
                        mapBodies[ev.data.id].addShape(mapShapes[ev.data.args[0]]);
                    } else if (body_op == 'removeShape') {
                        mapBodies[ev.data.id].removeShape(mapShapes[ev.data.args[0]]);
                    } else if (body_op == 'setAngularVelocity') {
                        var body = mapBodies[ev.data.id];
                        body.angularVelocity.x = ev.data.args[0].x;
                        body.angularVelocity.y = ev.data.args[0].y;
                        body.angularVelocity.z = ev.data.args[0].z;
                    } else if (body_op == 'mass') {
                        var body = mapBodies[ev.data.id];
                        body.mass = ev.data.args[0];
                        if (body.mass == 0) {
                            body.type = CANNON.Body.STATIC;
                        } else {
                            body.type = CANNON.Body.DYNAMIC;
                        }
                        nonStaticObject.push(body);
                        if (body.mass == 100000000000000) {
                            body.useGravity = false;
                        }
                    } else if (body_op == 'useGravity') {
                        var body = mapBodies[ev.data.id];
                        body.useGravity = ev.data.args[0];
                    }
                    break;

                case 'Shape':
                    var shape_op = ev.data.op;
                    if (shape_op == "updateBoundingSphereRadius") {
                        mapShapes[ev.data.id].updateBoundingSphereRadius();
                    } else if (shape_op == "center") {
                        const body = mapShapes[ev.data.id].body
                        if (body != null) {
                            const offset = body.shapeOffsets[0];
                            offset.x = ev.data.args[0].x;
                            offset.y = ev.data.args[0].y;
                            offset.z = ev.data.args[0].z;
                        }
                    }
                    break;

                case 'Box':
                    var box_op = ev.data.op;
                    if (box_op == 'size') {
                        const hf = mapShapes[ev.data.id].halfExtents;
                        hf.x = ev.data.args[0].x;
                        hf.y = ev.data.args[0].y;
                        hf.z = ev.data.args[0].z;
                    } else if (box_op == "updateConvexPolyhedronRepresentation") {
                        mapShapes[ev.data.id].updateConvexPolyhedronRepresentation();
                    }
                    break;

                case 'Sphere':
                    var sphere_op = ev.data.op;
                    if (sphere_op == 'radius') {
                        mapShapes[ev.data.id].radius = ev.data.args[0];
                    }
                    break;

                case 'material':
                    break;
            }
        }
    }
}