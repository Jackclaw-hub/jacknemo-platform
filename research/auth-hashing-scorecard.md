# Authentication Hashing Scorecard

## Options Evaluation

### Option A: Use Node.js crypto.pbkdf2 (Built-in)
**Pros:**
- No external dependencies
- Built into Node.js
- OWASP recommended (PBKDF2)
- Good security practices

**Cons:**
- Requires manual salt management
- More boilerplate code
- Less developer-friendly API

### Option B: Use Node.js crypto with SHA256 (Current Implementation)
**Pros:**
- Already implemented
- Simple to understand
- No dependencies

**Cons:**
- SHA256 not ideal for passwords (fast hashing)
- No built-in salt management
- Less secure than PBKDF2/bcrypt

### Option C: Use bcryptjs (Pure JS Alternative)
**Pros:**
- Industry standard for passwords
- Automatic salt handling
- Widely used and tested

**Cons:**
- Requires external dependency
- May have network installation issues

## Scorecard

| Kriterium         | Gewicht | Option A (PBKDF2) | Option B (SHA256) | Option C (bcryptjs) |
|-------------------|---------|-------------------|-------------------|---------------------|
| Passung zum Use Case | 30%  | 9/10             | 5/10             | 8/10               |
| Dokumentation     | 20%    | 8/10             | 6/10             | 9/10               |
| Community/Support | 15%    | 8/10             | 6/10             | 9/10               |
| Performance       | 20%    | 8/10             | 9/10             | 7/10               |
| Integrationskosten| 15%    | 10/10            | 10/10            | 5/10               |
| **Total**         | **100%**| **8.5/10**       | **6.9/10**       | **7.7/10**         |

## Recommendation
**Option A (Node.js crypto.pbkdf2)** is the best choice:
- No external dependencies (avoids network issues)
- OWASP recommended standard
- Built into Node.js
- Good security practices
- Already have working crypto implementation

## Implementation Plan
1. Update auth-native.js to use crypto.pbkdf2 instead of SHA256
2. Add proper salt generation and storage
3. Update password verification logic
4. Test the implementation