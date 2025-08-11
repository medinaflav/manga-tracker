import test from 'node:test';
import assert from 'node:assert';
import app from '../server';

test('GET /health', async () => {
  const server = app.listen();
  const port = (server.address() as any).port;
  const res = await fetch(`http://localhost:${port}/health`);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  await new Promise((resolve) => server.close(resolve));
});
