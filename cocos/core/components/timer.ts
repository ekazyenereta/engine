
export type SYSTEM_ID = 'd' | 'c';

export class Timer {
    private static readonly _ID2Timer: Map<SYSTEM_ID, Timer> = new Map<SYSTEM_ID, Timer>();

    static update () {
        this._ID2Timer.forEach((v: Timer) => {
            v.update();
        })
    }

    get firstTime () {
        return this._firstTime;
    }

    get totalFrames () {
        return this._totalFrames;
    }

    get realDeltaTime () {
        return this._deltaTime;
    }

    get realTotalTime () {
        return this._totalTime;
    }

    get realCurrentTime () {
        return this._lastTime;
    }

    get deltaTime () {
        return this._deltaTime_s;
    }

    get totoalTime () {
        return this._totalTime_s;
    }

    get currentTime () {
        return this._lastTime_s;
    }

    get timeScale () {
        return this._timeScale;
    }

    set timeScale (v: number) {
        if (v < 0) {
            console.warn("[Timer:] time scale should not be negative");
            return;
        }
        this._timeScale = v;
    }

    /** frame */
    private _totalFrames: number = -1;

    /** real */
    private _deltaTime: number = 0;
    private _firstTime: number = 0;
    private _lastTime: number = 0;
    private _totalTime: number = 0;

    /** scale */
    private _timeScale: number = 1;
    private _deltaTime_s: number = 0;
    private _totalTime_s: number = 0;
    private _lastTime_s: number = 0;

    init () {
        const time = performance.now();
        this._firstTime = time;
        this._lastTime = time;
    }

    update () {
        this._totalFrames++;
        const time = performance.now();
        this._deltaTime = time - this._lastTime;
        this._lastTime = time;
        this._totalTime += this._deltaTime;

        this._deltaTime_s = this._deltaTime * this._timeScale;
        this._totalTime_s += this._deltaTime_s;
        this._lastTime_s = this._totalTime_s - this._firstTime;
    }

}