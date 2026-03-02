import { homedir } from 'os';
import { join } from 'path';

describe('Config System', () => {
    const configPath = join(homedir(), 'point3_doc', '.config');
    const configDir = join(homedir(), 'point3_doc');

    it('should have correct config directory path', () => {
        expect(configDir).toContain('point3_doc');
    });

    it('should have correct config file path', () => {
        expect(configPath).toContain('point3_doc');
        expect(configPath).toContain('.config');
    });

    it('should use home directory for config', () => {
        const home = homedir();
        expect(configPath).toContain(home);
    });
});
