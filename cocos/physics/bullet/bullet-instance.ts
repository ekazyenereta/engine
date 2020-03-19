import { IAmmoBodyStruct, IAmmoGhostStruct } from './bullet-interface';

export class BulletInstance {
    static readonly bodyAndGhosts: {
        [x: string]: IAmmoBodyStruct | IAmmoGhostStruct
    } = {};

    static get bodyStructs () {
        return this.bodyAndGhosts as { [x: string]: IAmmoBodyStruct };
    }

    static get ghostStructs () {
        return this.bodyAndGhosts as { [x: string]: IAmmoGhostStruct };
    }
}