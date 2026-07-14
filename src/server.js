import app from './app.js';

const PORT = process.env.PORT || 3456;
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`🧙 Boundary Waters Academy → http://localhost:${PORT}`);
  });
}

export default app;
