/**
 * @category physics
 */

import { Enum } from "../../core";

export enum ERigidBodyType {
    DYNAMIC = 1,
    STATIC = 2,
    KINEMATIC = 4,
}

export enum EAxisDirection {
    X_AXIS,
    Y_AXIS,
    Z_AXIS,
}
Enum(EAxisDirection);

export enum ESimpleShapeType {
    VERTEX = 1,
    LINE = 2,
    TRIANGLE = 3,
    TETRAHEDRON = 4,
}
Enum(ESimpleShapeType);

export enum EConvexShapeType {
    BOX = 0,
    // TRIANGLE = 1,
    // TETRAHEDRAL = 2,
    // CONVEX_TRIANGLEMESH = 3,
    // CONVEX_HULL = 4,
    SPHERE = 8,
    CAPSULE = 10,
    // CONE = 11,
    // CONVEX = 12,
    CYLINDER = 13,
    // UNIFORM_SCALING = 14,
    // MINKOWSKI_SUM = 15,
    // MINKOWSKI_DIFFERENCE = 16,
    // BOX_2D = 17,
    // CONVEX_2D = 18,
}
Enum(EConvexShapeType);
