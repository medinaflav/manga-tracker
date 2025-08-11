import request from 'supertest';
import { createApp } from '../app';
import * as UserModel from '../models/User';

const app = createApp();

test('signup returns tokens', async () => {
  jest.spyOn(UserModel.User, 'create').mockResolvedValue({ id: '1' } as any);
  const res = await request(app).post('/auth/signup').send({
    email: 'a@b.com',
    username: 'alice',
    password: 'password'
  });
  expect(res.status).toBe(200);
  expect(res.body.accessToken).toBeDefined();
});
