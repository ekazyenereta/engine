﻿var Input = (function () {

    /**
     * Interface into the Input system.
     * @class Input
     * @static
     * @beta
     */
    var Input = {
        _eventListeners: new EventListeners(),
        _lastTarget: null
    };

    /**
     * Returns whether the current device supports touch input
     */
    Object.defineProperty(Input, 'hasTouch', {
        get: function () {
            return !!Engine._inputContext && Engine._inputContext.hasTouch;
        }
    });

    /**
     * !#en Register an callback of a specific input event type.
     *
     * For all supported event and type, please see [Input Events](/en/scripting/input-events)
     *
     * !#zh 注册输入事件的回调方法。
     *
     * 请参考：
     * - [获取用户输入](/zh/scripting/input)
     * - [输入事件列表](/zh/scripting/input-events)
     *
     * @method on
     * @param {string} type - eg. "keydown", "click"
     * @param {function} callback
     * @param {Event} callback.param event - the input event
     * @beta
     */
    Input.on = function (type, callback) {
        if (callback) {
            this._eventListeners.add(type, callback);
        }
        else {
            Fire.error('Callback must be non-nil');
        }
    };

    /**
     * Removes the callback previously registered with the same type and callback.
     * @method off
     * @param {string} type
     * @param {function} callback
     * @beta
     */
    Input.off = function (type, callback) {
        if (callback) {
            if (! this._eventListeners.remove(type, callback)) {
                Fire.warn('Callback not exists');
            }
        }
        else {
            Fire.error('Callback must be non-nil');
        }
    };

    Input._reset = function () {
        this._eventListeners = new EventListeners();
        this._lastTarget = null;
    };

    Input._dispatchMouseEvent = function (event, inputContext) {
        var camera = inputContext.renderContext.camera || Engine._scene.camera;
        var worldMousePos = camera.screenToWorld(new Vec2(event.screenX, event.screenY));
        var target = Engine._interactionContext.pick(worldMousePos);
        var eventInfo;
        //
        if (this._lastTarget && this._lastTarget !== target) {
            // 鼠标离开事件
            eventInfo = EventRegister.inputEvents.mouseleave;
            var mouseleaveEvent = event.clone();
            mouseleaveEvent.bubbles = eventInfo.bubbles;
            mouseleaveEvent.type = 'mouseleave';
            this._lastTarget.dispatchEvent(mouseleaveEvent);
        }
        if (target) {
            target.dispatchEvent(event);
            // 鼠标进入事件
            if (this._lastTarget !== target) {
                eventInfo = EventRegister.inputEvents.mouseenter;
                var mouseenterEvent = event.clone();
                mouseenterEvent.bubbles = eventInfo.bubbles;
                mouseenterEvent.type = 'mouseenter';
                target.dispatchEvent(mouseenterEvent);
            }
        }
        this._lastTarget = target;
    };

    Input._dispatchEvent = function (event, inputContext) {
        // dispatch global event
        this._eventListeners.invoke(event);
        // dispatch mouse event through hierarchy
        if (event instanceof Fire.MouseEvent) {
            this._dispatchMouseEvent(event, inputContext);
        }
    };

    return Input;
})();

Fire.Input = Input;
