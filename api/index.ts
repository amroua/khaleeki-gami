import app, { initServices } from '../server/app';

// Track serverless container initialization
let isReady = false;

export default async function handler(req: any, res: any) {
  if (!isReady) {
    try {
      await initServices();
      isReady = true;
    } catch (err) {
      console.error('[Vercel Serverless] Service init warning:', err);
    }
  }
  return app(req, res);
}
