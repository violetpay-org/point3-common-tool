"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRepository = exports.TestRepositoryGroup = void 0;
class TestRepositoryGroup {
    static push(repository) {
        this.repositories.push(repository);
    }
    static async purge() {
        await Promise.all(this.repositories.map(repo => repo.purge()));
    }
    static async disconnect() {
        await Promise.all(this.repositories.map(repo => repo.disconnect()));
        this.repositories = [];
    }
}
exports.TestRepositoryGroup = TestRepositoryGroup;
TestRepositoryGroup.repositories = [];
class TestRepository {
    constructor() {
        TestRepositoryGroup.push(this);
    }
}
exports.TestRepository = TestRepository;
//# sourceMappingURL=test-repository.js.map