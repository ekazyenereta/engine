/*
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

/**
 * @category ui
 */

import { Component, EventHandler } from '../../core/components';
import { ccclass, help, executionOrder, menu, property } from '../../core/data/class-decorator';
import { EventTouch, SystemEventType, Touch } from '../../core/platform';
import { Vec3 } from '../../core/math';
import { ccenum } from '../../core/value-types/enum';
import { clamp01 } from '../../core/math/utils';
import { SpriteComponent } from './sprite-component';
import { EDITOR } from 'internal:constants';

const _tempPos = new Vec3();
/**
 * @en
 * The Slider Direction.
 *
 * @zh
 * 滑动器方向。
 */
enum Direction {
    /**
     * @en
     * The horizontal direction.
     *
     * @zh
     * 水平方向。
     */
    Horizontal = 0,
    /**
     * @en
     * The vertical direction.
     *
     * @zh
     * 垂直方向。
     */
    Vertical = 1,
}

ccenum(Direction);

/**
 * @en
 * The Slider Control.
 *
 * @zh
 * 滑动器组件。
 */
@ccclass('cc.SliderComponent')
@help('i18n:cc.SliderComponent')
@executionOrder(110)
@menu('UI/Slider')
export class SliderComponent extends Component {

    /**
     * @en
     * The "handle" part of the slider.
     *
     * @zh
     * 滑动器滑块按钮部件。
     */
    @property({
        type: SpriteComponent,
        tooltip:'滑块按钮部件',
    })
    get handle () {
        return this._handle;
    }

    set handle (value: SpriteComponent | null) {
        if (this._handle === value) {
            return;
        }

        this._handle = value;
        if (EDITOR && this._handle) {
            this._updateHandlePosition();
        }
    }

    /**
     * @en
     * The slider direction.
     *
     * @zh
     * 滑动器方向。
     */
    @property({
        type: Direction,
        tooltip:'滑动方向',
    })
    get direction () {
        return this._direction;
    }

    set direction (value: number) {
        if (this._direction === value) {
            return;
        }

        this._direction = value;
        this._changeLayout();
    }

    /**
     * @en
     * The current progress of the slider. The valid value is between 0-1.
     *
     * @zh
     * 当前进度值，该数值的区间是 0-1 之间。
     */
    @property({
        slide: true,
        range: [0, 1, 0.01],
        tooltip:'当前进度值，该数值的区间是 0 - 1 之间。',
    })
    get progress () {
        return this._progress;
    }

    set progress (value) {
        if (this._progress === value) {
            return;
        }

        this._progress = value;
        this._updateHandlePosition();
    }

    public static Direction = Direction;

    /**
     * @en
     * The slider slide events' callback array.
     *
     * @zh
     * 滑动器组件事件回调函数。
     */
    @property({
        type: EventHandler,
        tooltip:'滑动器组件事件回调函数',
    })
    public slideEvents: EventHandler[] = [];
    @property
    private _handle: SpriteComponent | null = null;
    @property
    private _direction = Direction.Horizontal;
    @property
    private _progress = 0.1;

    private _offset: Vec3 = new Vec3();
    private _dragging = false;
    private _touchHandle = false;
    private _handlelocalPos = new Vec3();
    private _touchPos = new Vec3();

    public __preload () {
        this._updateHandlePosition();
    }

    // 注册事件

    public onEnable () {
        this._updateHandlePosition();

        this.node.on(SystemEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(SystemEventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.on(SystemEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(SystemEventType.TOUCH_CANCEL, this._onTouchCancelled, this);
        if (this._handle && this._handle.isValid) {
            this._handle.node.on(SystemEventType.TOUCH_START, this._onHandleDragStart, this);
            this._handle.node.on(SystemEventType.TOUCH_MOVE, this._onTouchMoved, this);
            this._handle.node.on(SystemEventType.TOUCH_END, this._onTouchEnded, this);
        }
    }

    public onDisable () {
        this.node.off(SystemEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.off(SystemEventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.off(SystemEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(SystemEventType.TOUCH_CANCEL, this._onTouchCancelled, this);
        if (this._handle && this._handle.isValid) {
            this._handle.node.off(SystemEventType.TOUCH_START, this._onHandleDragStart, this);
            this._handle.node.off(SystemEventType.TOUCH_MOVE, this._onTouchMoved, this);
            this._handle.node.off(SystemEventType.TOUCH_END, this._onTouchEnded, this);
        }
    }

    protected _onHandleDragStart (event?: EventTouch) {
        if (!event || !this._handle || !this._handle.node._uiProps.uiTransformComp) {
            return;
        }

        this._dragging = true;
        this._touchHandle = true;
        const touhPos = event.touch!.getUILocation();
        Vec3.set(this._touchPos, touhPos.x, touhPos.y, 0);
        this._handle.node._uiProps.uiTransformComp.convertToNodeSpaceAR(this._touchPos, this._offset);

        event.propagationStopped = true;
    }

    protected _onTouchBegan (event?: EventTouch) {
        if (!this._handle || !event) {
            return;
        }

        this._dragging = true;
        if (!this._touchHandle) {
            this._handleSliderLogic(event.touch);
        }

        event.propagationStopped = true;
    }

    protected _onTouchMoved (event?: EventTouch) {
        if (!this._dragging || !event) {
            return;
        }

        this._handleSliderLogic(event.touch);
        event.propagationStopped = true;
    }

    protected _onTouchEnded (event?: EventTouch) {
        this._dragging = false;
        this._touchHandle = false;
        this._offset = new Vec3();

        if (event) {
            event.propagationStopped = true;
        }
    }

    protected _onTouchCancelled (event?: EventTouch) {
        this._dragging = false;
        if (event) {
            event.propagationStopped = true;
        }
    }

    protected _handleSliderLogic (touch: Touch | null) {
        this._updateProgress(touch);
        this._emitSlideEvent();
    }

    protected _emitSlideEvent () {
        EventHandler.emitEvents(this.slideEvents, this);
        this.node.emit('slide', this);
    }

    protected _updateProgress (touch: Touch | null) {
        if (!this._handle || !touch) {
            return;
        }

        const touchPos = touch.getUILocation();
        Vec3.set(this._touchPos, touchPos.x, touchPos.y, 0);
        const localTouchPos = this.node._uiProps.uiTransformComp!.convertToNodeSpaceAR(this._touchPos, _tempPos);
        if (this.direction === Direction.Horizontal) {
            this.progress = clamp01(0.5 + (localTouchPos.x - this._offset.x) / this.node.width!);
        } else {
            this.progress = clamp01(0.5 + (localTouchPos.y - this._offset.y) / this.node.height!);
        }
    }

    protected _updateHandlePosition () {
        if (!this._handle) {
            return;
        }
        this._handlelocalPos.set(this._handle.node.getPosition());
        if (this._direction === Direction.Horizontal) {
            this._handlelocalPos.x = -this.node.width! * this.node.anchorX! + this.progress * this.node.width!;
        } else {
            this._handlelocalPos.y = -this.node.height! * this.node.anchorY! + this.progress * this.node.height!;
        }

        this._handle.node.setPosition(this._handlelocalPos);
    }

    private _changeLayout () {
        const contentSize = this.node.getContentSize();
        this.node.setContentSize(contentSize.height, contentSize.width);
        if(this._handle){
            const pos = this._handle.node.position;
            if (this._direction === Direction.Horizontal) {
                this._handle.node.setPosition(pos.x, 0, pos.z);
            } else {
                this._handle.node.setPosition(0, pos.y, pos.z);
            }

            this._updateHandlePosition();
        }
    }
}

cc.SliderComponent = SliderComponent;

/**
 * @zh
 * 注意：此事件是从该组件所属的 Node 上面派发出来的，需要用 node.on 来监听。
 * @event slide
 * @param {Event.EventCustom} event
 * @param {Slider} slider - The slider component.
 */
