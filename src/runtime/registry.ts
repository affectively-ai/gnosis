export type GnosisHandler = (payload: any, props: Record<string, string>) => Promise<any>;

export class GnosisRegistry {
    private handlers = new Map<string, GnosisHandler>();

    public register(label: string, handler: GnosisHandler) {
        this.handlers.set(label, handler);
    }

    public getHandler(label: string): GnosisHandler | undefined {
        return this.handlers.get(label);
    }
}
