const AuthService = require('../src/auth');

// Mock environment variable for testing
process.env.JWT_SECRET = 'test-secret-key';

describe('AuthService', () => {
    let authService;

    beforeEach(() => {
        authService = new AuthService('test-secret-key');
    });

    test('should hash password correctly', async () => {
        const password = 'securepassword123';
        const hash = await authService.hashPassword(password);
        
        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(50);
    });

    test('should compare passwords correctly', async () => {
        const password = 'securepassword123';
        const hash = await authService.hashPassword(password);
        
        const match = await authService.comparePassword(password, hash);
        const wrongMatch = await authService.comparePassword('wrongpassword', hash);
        
        expect(match).toBe(true);
        expect(wrongMatch).toBe(false);
    });

    test('should generate and verify JWT token', () => {
        const user = {
            id: 1,
            email: 'test@example.com',
            role: 'user',
            full_name: 'Test User'
        };

        const token = authService.generateToken(user, 3600);
        expect(token).toBeDefined();
        
        const decoded = authService.verifyToken(token);
        expect(decoded.sub).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        expect(decoded.role).toBe(user.role);
    });

    test('should extract token from Authorization header', () => {
        const header = 'Bearer abc123.def456.ghi789';
        const token = authService.extractTokenFromHeader(header);
        
        expect(token).toBe('abc123.def456.ghi789');
    });

    test('should return null for invalid Authorization header', () => {
        expect(authService.extractTokenFromHeader('InvalidHeader')).toBeNull();
        expect(authService.extractTokenFromHeader(null)).toBeNull();
        expect(authService.extractTokenFromHeader('')).toBeNull();
    });

    test('should generate and verify reset token', () => {
        const email = 'test@example.com';
        const resetToken = authService.generateResetToken(email);
        
        expect(resetToken).toBeDefined();
        
        const decoded = authService.verifyResetToken(resetToken);
        expect(decoded.email).toBe(email);
        expect(decoded.purpose).toBe('reset');
    });
});