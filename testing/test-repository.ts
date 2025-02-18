/**
 * 테스트 시에만 사용
 * 테스트 종료 후 호출해야함
 * 
 * Singleton 객체로 테스트 이후에 모든 테스트 레포지토리를 정리하기 위해 사용
 */
export class TestRepositoryGroup {
    private static repositories: TestRepository[] = [];

    public static push(repository: TestRepository) {
        this.repositories.push(repository);
    }

    public static async purge() {
        await Promise.all(this.repositories.map(repo => repo.purge()));
    }

    public static async disconnect() {
        await Promise.all(this.repositories.map(repo => repo.disconnect()));
        this.repositories = [];
    }
}

export abstract class TestRepository {
    constructor() {
        TestRepositoryGroup.push(this);
    }

    abstract purge(): Promise<void>;
    abstract disconnect(): Promise<void>;
}