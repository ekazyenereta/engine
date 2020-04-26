/**
 * 物理模块
 * @category physics
 */

import {
    ccclass,
    help,
    disallowMultiple,
    executeInEditMode,
    executionOrder,
    menu,
    property,
} from '../../../core/data/class-decorator';
import { Component } from '../../../core';
import { ICharacterController } from '../../spec/i-character-controller';
import { createCharacterController } from '../instance';
import { EDITOR } from 'internal:constants';
import { ConvexShape } from './../shapes/convex-shape';

/**
 * @en
 * Character controller component.
 * @zh
 * 角色控制器组件。
 */
@ccclass('cc.CharacterController')
@help('i18n:cc.CharacterController')
@executionOrder(99)
@menu('Physics/CharacterController(beta)(ammo.js only)')
@executeInEditMode
@disallowMultiple
export class CharacterController extends Component {

    @property
    get stepHeight () {
        return this._stepHeight;
    }

    set stepHeight (v) {
        this._stepHeight = v;
    }

    @property
    get slopLimit () {
        return this._slopLimit;
    }

    set slopLimit (v) {
        this._slopLimit = v;
    }

    @property
    get fallSpeed () {
        return this._fallSpeed;
    }

    set fallSpeed (v) {
        this._fallSpeed = v;
    }

    @property
    get jumpSpeed () {
        return this._jumpSpeed;
    }

    set jumpSpeed (v) {
        this._jumpSpeed = v;
    }

    @property
    get gravity () {
        return this._gravity;
    }

    set gravity (v) {
        this._gravity = v;
    }

    @property({ type: ConvexShape })
    get convexShape () {
        return this._convexShape;
    }

    set convexShape (v) {
        this._convexShape = v;
    }

    @property
    private _stepHeight = 0.35;

    @property
    private _slopLimit = 45;

    @property
    private _fallSpeed = 55;

    @property
    private _jumpSpeed = 10;

    @property
    private _gravity = 9.8 * 3;

    @property
    private _convexShape = new ConvexShape();

    constructor () {
        super();
    }

}