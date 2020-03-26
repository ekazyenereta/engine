import instantiate from '@cocos/bullet';

//asmLibraryArg
var asmLibraryArg = {
    memory: {},
    getWorldTransform: (id: number, transform: number) => { },
    setWorldTransform: (id: number, transform: number) => {
        // var v3 = BULLET.btTransform_getOrigin(transform);
        // var x = BULLET.btVector3_x(v3);
        // var y = BULLET.btVector3_y(v3);
        // var z = BULLET.btVector3_z(v3);
        // // console.log(x, y, z);
    }
};

//memory
var wasmMemory = { buffer: new ArrayBuffer(16 * 1024 * 1024) };

export const BULLET = instantiate(asmLibraryArg, wasmMemory);
window["BULLET"] = BULLET;
