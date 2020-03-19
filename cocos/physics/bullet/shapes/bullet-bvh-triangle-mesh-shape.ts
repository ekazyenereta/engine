import { BULLET } from './../bullet-export';
import { BulletShape } from "./bullet-shape";
import { Mesh, GFXPrimitiveMode, warn, warnID } from "../../../core";
import { MeshColliderComponent } from '../../../../exports/physics-framework';
import { cocos2BulletVec3 } from '../bullet-util';
import { btBroadphaseNativeTypes } from '../bullet-enum';
import { ITrimeshShape } from '../../spec/i-physics-shape';
import { BulletConstant } from '../bullet-const';

export class BulletBvhTriangleMeshShape extends BulletShape implements ITrimeshShape {

    public get collider () {
        return this._collider as MeshColliderComponent;
    }

    public get impl () {
        return this._btShape;
    }

    setMesh (v: Mesh | null) {
        if (!this._isBinding) return;

        if (this._btShape != null && this._btShape != BulletConstant.instance.EMPTY_SHAPE) {
            // TODO: change the mesh after initialization
            warnID(9620);
        } else {
            const mesh = v;
            if (mesh && mesh.renderingSubMeshes.length > 0) {
                this._btTriangleMesh = BULLET.btTriangleMesh_create();
                const len = mesh.renderingSubMeshes.length;
                for (let i = 0; i < len; i++) {
                    const subMesh = mesh.renderingSubMeshes[i];
                    const geoInfo = subMesh.geometricInfo;
                    if (geoInfo) {
                        const primitiveMode = subMesh.primitiveMode;
                        const vb = geoInfo.positions;
                        const ib = geoInfo.indices as any;
                        if (primitiveMode == GFXPrimitiveMode.TRIANGLE_LIST) {
                            const cnt = ib.length;
                            for (let j = 0; j < cnt; j += 3) {
                                var i0 = ib[j] * 3;
                                var i1 = ib[j + 1] * 3;
                                var i2 = ib[j + 2] * 3;
                                const v0 = BULLET.btVector3_create(vb[i0], vb[i0 + 1], vb[i0 + 2]);
                                const v1 = BULLET.btVector3_create(vb[i1], vb[i1 + 1], vb[i1 + 2]);
                                const v2 = BULLET.btVector3_create(vb[i2], vb[i2 + 1], vb[i2 + 2]);
                                BULLET.btTriangleMesh_addTriangle(this._btTriangleMesh, v0, v1, v2);
                            }
                        } else if (primitiveMode == GFXPrimitiveMode.TRIANGLE_STRIP) {
                            const cnt = ib.length - 2;
                            let rev = 0;
                            for (let j = 0; j < cnt; j += 1) {
                                const i0 = ib[j - rev] * 3;
                                const i1 = ib[j + rev + 1] * 3;
                                const i2 = ib[j + 2] * 3;
                                const v0 = BULLET.btVector3_create(vb[i0], vb[i0 + 1], vb[i0 + 2]);
                                const v1 = BULLET.btVector3_create(vb[i1], vb[i1 + 1], vb[i1 + 2]);
                                const v2 = BULLET.btVector3_create(vb[i2], vb[i2 + 1], vb[i2 + 2]);
                                BULLET.btTriangleMesh_addTriangle(this._btTriangleMesh, v0, v1, v2);
                            }
                        } else if (primitiveMode == GFXPrimitiveMode.TRIANGLE_FAN) {
                            const cnt = ib.length - 1;
                            const i0 = ib[0] * 3;
                            const v0 = BULLET.btVector3_create(vb[i0], vb[i0 + 1], vb[i0 + 2]);
                            for (let j = 1; j < cnt; j += 1) {
                                const i1 = ib[j] * 3;
                                const i2 = ib[j + 1] * 3;
                                const v1 = BULLET.btVector3_create(vb[i1], vb[i1 + 1], vb[i1 + 2]);
                                const v2 = BULLET.btVector3_create(vb[i2], vb[i2 + 1], vb[i2 + 2]);
                                BULLET.btTriangleMesh_addTriangle(this._btTriangleMesh, v0, v1, v2);
                            }
                        }
                    }
                }
                this._btShape = BULLET.btBvhTriangleMeshShape_create(this._btTriangleMesh, true, true);
                // this._btShape = BULLET.btGImpactMeshShape(this._btTriangleMesh);
                // BULLET.btGImpactMeshShape_updateBound(this._btShape);
                cocos2BulletVec3(this.scale, this._collider.node.worldScale);
                BULLET.btCollisionShape_setLocalScaling(this._btShape, this.scale);
                this.setWrapper();
                this.setCompound(this._btCompound);
            } else {
                this._btShape = BulletConstant.instance.EMPTY_SHAPE;
            }
        }
    }

    private _btTriangleMesh!: number;

    constructor () {
        super(btBroadphaseNativeTypes.TRIANGLE_MESH_SHAPE_PROXYTYPE);
    }

    onComponentSet () {
        this.setMesh(this.collider.mesh);
    }

    setCompound (compound: number | null) {
        super.setCompound(compound);
        BULLET.btCollisionShape_setUserIndex(this.impl, this._index);
    }

    updateScale () {
        super.updateScale();
        cocos2BulletVec3(this.scale, this._collider.node.worldScale);
        BULLET.btCollisionShape_setLocalScaling(this._btShape, this.scale);
        if (this._btCompound) {
            BULLET.btCompoundShape_updateChildTransform(this._btCompound, this._index, this.transform, true);
        }
    }

}
