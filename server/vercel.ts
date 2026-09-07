import app, { initServices } from './app';

let isReady = false;

export default async function handler(req: any, res: any) {
  if (!isReady) {
    try {
      await initServices();
      isReady = true;
    } catch (err) {
      console.error('[Vercel] Service init error:', err);
    }
  }

  return app(req, res);
}
