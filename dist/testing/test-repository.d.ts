export declare class TestRepositoryGroup {
    private static repositories;
    static push(repository: TestRepository): void;
    static purge(): Promise<void>;
    static disconnect(): Promise<void>;
}
export declare abstract class TestRepository {
    constructor();
    abstract purge(): Promise<void>;
    abstract disconnect(): Promise<void>;
}
