export interface Asset {
    id: number;
    name: string;
    unitName: string;
    creator: string;
    manager: string;
    reserve: string;
    deleted: boolean;
    decimals: number;
    total: number;
}