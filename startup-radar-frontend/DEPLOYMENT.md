# Deployment Guide

## Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Environment Variables
Create a `.env.local` file based on `.env.example` for development:
```bash
cp .env.example .env.local
```

## Vite Features
- Hot module replacement (HMR)
- Fast builds with esbuild
- Optimized production bundles
- TypeScript support out of the box