import { error } from "../platform";

export class Timer {

    static readonly id2Timer = new Map<string, Timer>();

    static readonly default = new Timer('default');

    static init () {
        this.id2Timer.forEach((v: Timer) => { v.init(); })
    }

    static update () {
        this.id2Timer.forEach((v: Timer) => { v.update(); })
    }

    static resume () {
        this.id2Timer.forEach((v: Timer) => { v.resume(); })
    }

    get firstTime () { return this._firstTime; }
    get totalFrames () { return this._totalFrames; }

    /** real time */

    get realDeltaTime () { return this._deltaTime; }
    get realTotalTime () { return this._totalTime; }
    get realCurrentTime () { return this._lastTime; }

    /** time */

    get deltaTime () { return this._deltaTime_s; }
    get totoalTime () { return this._totalTime_s; }
    get currentTime () { return this._lastTime_s; }

    /** scale */

    get timeScale () { return this._timeScale; }

    /**
     * @zh
     * 缩放时间因子
     */
    set timeScale (v: number) {
        if (v < 0) {
            console.warn("[Timer:] time scale should not be negative");
            return;
        }
        this._timeScale = v;
    }

    // get enable () { return this._enable; }

    // set enable (v: boolean) {
    //     this._enable = v;
    // }

    readonly id: string;
    private _enable = true;

    /** frame */
    private _totalFrames: number = 0;

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

    private constructor (id: string) {
        this.id = id;
        if (Timer.id2Timer.has(id)) {
            error('[Timer] duplicate id:', id);
        }
        Timer.id2Timer.set(id, this);
    }

    init () {
        const time = performance.now();
        this._firstTime = time;
        this._lastTime = time;
    }

    update () {
        if (this._enable) {
            this._totalFrames++;

            const time = performance.now();
            this._deltaTime = time - this._lastTime;
            this._lastTime = time;
            this._totalTime += this._deltaTime;

            this._deltaTime_s = this._deltaTime * this._timeScale;
            this._totalTime_s += this._deltaTime_s;
            this._lastTime_s = this._totalTime_s - this._firstTime;
        } else {
            this._deltaTime = 0;
            this._deltaTime_s = 0;
            // this._lastTime = performance.now(); // should i update?
        }
    }

    resume () {
        this._lastTime = performance.now();
        this._deltaTime = 0;
        this._deltaTime_s = 0;        
    }

    clone (id: string) {
        const c = new Timer(id);
        c._enable = this._enable;
        c._totalFrames = this._totalFrames;
        c._deltaTime = this._deltaTime;
        c._firstTime = this._firstTime;
        c._lastTime = this._lastTime;
        c._totalTime = this._totalTime;
        c._timeScale = this._timeScale;
        c._deltaTime_s = this._deltaTime_s;
        c._totalTime_s = this._totalTime_s;
        c._lastTime_s = this._lastTime_s;
        return c;
    }
}