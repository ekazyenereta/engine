/*
 Copyright (c) 2019 Xiamen Yaji Software Co., Ltd.

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
 * @hidden
 */

import { ISchedulable } from "../scheduler";
import { Timer } from "./timer";

export default class System implements ISchedulable {
    protected _id = '';
    protected _priority = 0;
    protected _executeInEditMode = false;
    protected _isSharedTimer = true;
    protected _timer!: Timer;

    set priority (value: number) {
        this._priority = value;
    }
    get priority (): number {
        return this._priority;
    }

    set id (id: string) {
        this._id = id;
    }
    get id (): string {
        return this._id;
    }

    get timer (): Timer {
        if (!this._isSharedTimer) {
            this._timer = this._timer.clone(this.id);
            this._isSharedTimer = false;
        }
        return this._timer;
    }

    get sharedTimer (): Timer {
        return this._timer;
    }

    public static sortByPriority (a: System, b: System) {
        if (a._priority < b._priority) {
            return 1;
        }
        else if (a._priority > b.priority) {
            return -1;
        }
        else {
            return 0;
        }
    }

    protected constructor () { };

    init () {
        this._timer = Timer.default;
    }

    update (dt: number) { }
    postUpdate (dt: number) { }
}