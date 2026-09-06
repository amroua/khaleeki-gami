
import app, { initServices } from '../server/app.ts';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await initServices();
    } catch (error) {
      console.error('Service initialization error:', error);
    }
    initialized = true;
  }

  return app(req, res);
}
