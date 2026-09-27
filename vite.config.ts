import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), payment=(), geolocation=(self)',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.insforge.app https://maps.googleapis.com https://maps.gstatic.com",
    "connect-src 'self' https://*.insforge.app wss://*.insforge.app https://maps.googleapis.com",
    "frame-ancestors 'none'",
  ].join('; '),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders,
    watch: {
      ignored: ['**/image/**', '**/public/map-sequence/**', '**/tests/**', '**/dist/**', '**/.git/**'],
    },
  },
  preview: {
    headers: securityHeaders,
  },
});
