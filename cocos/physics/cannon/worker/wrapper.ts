import { Vec3, Quat } from './../../../core/math';

let worker!: Worker;

if (window.useWorker) {
    worker = new Worker(window.physicsWorkerPath);
    worker.onmessage = function (this: Worker, ev: MessageEvent) {
        const func = ev.data.func;
        if (func == "sync_physics") {
            const world = cc.PhysicsSystem.instance.physicsWorld;
            const data = ev.data.data;
            for (let i = 0; i < data.length; i++) {
                const id = data[i].id;
                const sharedBody = world.getSharedBodyByID(id);
                sharedBody.node.setWorldRotation(data[i].quat);
                sharedBody.node.setWorldPosition(data[i].pos);
            }
        }
    }
} else {
    (worker as any) = {
        postMessage: () => { }
    };
}

interface EventTarget {
    // addEventListener (type: string, listener: Function): EventTarget;
    // hasEventListener (type: string, listener: Function): boolean;
    // removeEventListener (type: string, listener: Function): EventTarget;
    // dispatchEvent (event: any): any;
}

class World implements EventTarget {
    allowSleep = true;
    gravity = new Vec3();
    defaultMaterial = new Material('default');
    constructor () {
        worker.postMessage({
            'func': 'new',
            'type': 'World'
        })
    }
    addEventListener (type: string, listener: Function): any { }

    addBody (body: Body): void {
        worker.postMessage({
            'func': 'World',
            'op': 'addBody',
            'args': [body.id]
        })
    }

    remove (body: Body): void {
        worker.postMessage({
            'func': 'World',
            'op': 'remove',
            'args': [body.id]
        })
    }
    // addConstraint (c: Constraint): void;
    // removeConstraint (c: Constraint): void;
    rayTest (from: Vec3, to: Vec3, result: any): void { }
    addMaterial (m: Material): void { }
    addContactMaterial (cmat: any): void { }

    step (dy: number, timeSinceLastCalled?: number, maxSubSteps?: number): void {
        worker.postMessage({
            'func': 'World',
            'op': 'step',
            'args': [dy, timeSinceLastCalled, maxSubSteps]
        })
    }

    emitTriggeredEvents (): void { }
    emitCollisionEvents (): void { }
}

class Body implements EventTarget {

    static DYNAMIC = 1 << 0;
    static STATIC = 1 << 1;
    static KINEMATIC = 1 << 2;

    set mass (v: any) {
        worker.postMessage({
            'func': 'Body',
            'op': 'mass',
            'id': this.id,
            'args': [v]
        })
    }

    id: any;
    shapes = [];
    shapeOffsets = [];
    shapeOrientations = [];
    position = new Vec3();
    quaternion = new Quat();
    linearFactor = new Vec3();
    linearVelocity = new Vec3();
    angularFactor = new Vec3();
    angularVelocity = new Vec3();

    constructor (id: any) {
        this.id = id;
        worker.postMessage({
            'func': 'new',
            'type': 'Body',
            'id': this.id
        })
    }

    addEventListener (type: string, listener: Function): any { }

    public isAwake (): boolean {
        return true;
    }
    public isSleeping (): boolean {
        return false;
    }
    public isSleepy (): boolean {
        return false;
    }
    public wakeUp (): void {

    }
    public sleep (): void {

    }
    public addShape (shape: any): void {
        worker.postMessage({
            'func': 'Body',
            'op': 'addShape',
            'id': this.id,
            'args': [shape.id]
        })
    }

    public removeShape (shape: any): void {
        worker.postMessage({
            'func': 'Body',
            'op': 'removeShape',
            'id': this.id,
            'args': [shape.id]
        })
    }

    public updateBoundingRadius (): void {
        worker.postMessage({
            'func': 'Body',
            'op': 'updateBoundingRadius',
            'id': this.id,
        })
    }
    public updateMassProperties (): void {
        worker.postMessage({
            'func': 'Body',
            'op': 'updateMassProperties',
            'id': this.id,
        })
    }
    public updateHasTrigger (): void {
        worker.postMessage({
            'func': 'Body',
            'op': 'updateHasTrigger',
            'id': this.id,
        })
    }

    public setAngularVelocity (v: Vec3): void {
        worker.postMessage({
            'func': 'Body',
            'op': 'setAngularVelocity',
            'id': this.id,
            'args': [v]
        })
    }

    public syncInitial () {
        worker.postMessage({
            'func': 'Body',
            'op': 'syncInitial',
            'id': this.id,
            'args': [this.position, this.quaternion]
        })
    }
}

let id = 0;
class Shape implements EventTarget {
    id = 0;

    collisionFilterMask: number = -1;
    collisionFilterGroup: number = 1;
    collisionResponse: boolean = true;
    material!: Material;

    addEventListener (type: string, listener: Function): any { }
    updateBoundingSphereRadius (): any {
        worker.postMessage({
            'func': 'Shape',
            'op': 'updateBoundingSphereRadius',
            'id': this.id,
        })
    }

    set center (v: Vec3) {
        worker.postMessage({
            'func': 'Shape',
            'op': 'center',
            'id': this.id,
            'args': [v]
        })
    }

    constructor () {
        this.id = id++;
    }
}

class Sphere extends Shape {
    _radius: number = 0;
    get radius () { return this._radius; }
    set radius (v: number) {
        worker.postMessage({
            'func': 'Sphere',
            'op': 'radius',
            'id': this.id,
            'args': [v]
        })
    }

    constructor (radius: number) {
        super();
        this._radius = radius;

        worker.postMessage({
            'func': 'new',
            'type': 'Sphere',
            'id': this.id,
            'args': [radius]
        })

    }
}

class Box extends Shape {
    set size (v: Vec3) {
        worker.postMessage({
            'func': 'Box',
            'op': 'size',
            'id': this.id,
            'args': [v]
        })
    }

    halfExtents: Vec3;
    constructor (halfExtents: Vec3) {
        super();
        this.halfExtents = halfExtents.clone();

        worker.postMessage({
            'func': 'new',
            'type': 'Box',
            'id': this.id,
            'args': [halfExtents]
        })
    }

    updateConvexPolyhedronRepresentation (): void {
        worker.postMessage({
            'func': 'Box',
            'op': 'updateConvexPolyhedronRepresentation',
            'id': this.id
        })
    }
}


class Material {
    public name: string = '';
    public id: number = 0;
    public friction: number = -1;
    public restitution: number = -1;

    constructor (name: string) {
        this.name = name;

        worker.postMessage({
            'func': 'new',
            'type': 'Material',
            'id': this.name,
            'args': [this.name]
        })
    }
}



class RaycastResult {

}

class NaiveBroadphase {

    constructor () {

        worker.postMessage({
            'func': 'new',
            'type': 'NaiveBroadphase'
        })
    }
}

(window as any).CANNON = {
    World,
    Body,
    Sphere,
    Box,
    Shape,
    Material,
    Vec3,
    Quaternion: Quat,
    RaycastResult,
    NaiveBroadphase
};