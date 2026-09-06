
const appModule = await import('../server/app.ts');

const app = appModule.default;

export default async function handler(req, res) {
  return app(req, res);
}
