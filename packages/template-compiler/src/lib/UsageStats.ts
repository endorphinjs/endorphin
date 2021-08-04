import { RenderContext } from '../types';

export default class UsageStats {
    mount = 0;
    update = 0;
    unmount = 0;

    /**
     * Marks given render context as used
     */
    use(ctx: RenderContext): void {
        if (ctx === 'shared') {
            this.mount++;
            this.update++;
        } else {
            this[ctx]++;
        }
    }
}
