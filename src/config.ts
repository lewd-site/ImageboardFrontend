export const config = {
  api: {
    host: process.env.API_HOST || 'http://127.0.0.1:3000',
  },
  content: {
    host: process.env.CONTENT_HOST || 'http://127.0.0.1:3000',
  },
  sse: {
    host: process.env.SEE_HOST || 'http://127.0.0.1:3002/sse',
  },
};

export default config;
