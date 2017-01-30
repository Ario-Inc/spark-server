/* eslint-disable */
import test from 'ava';
import request from 'supertest';
import ouathClients from '../src/oauthClients.json';
import app from './setup/testApp';
import TestData from './setup/TestData';

const container = app.container;
let DEVICE_ID = null;
let testUser;
let userToken;
let deviceToApiAttributes;

test.before(async () => {
  const USER_CREDENTIALS = TestData.getUser();
  DEVICE_ID = TestData.getID();

  const userResponse = await request(app)
    .post('/v1/users')
    .send(USER_CREDENTIALS);

  testUser = await container.constitute('UserRepository')
    .getByUsername(USER_CREDENTIALS.username);

  const tokenResponse = await request(app)
    .post('/oauth/token')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      client_id: ouathClients[0].clientId,
      client_secret: ouathClients[0].clientSecret,
      grant_type: 'password',
      password: USER_CREDENTIALS.password,
      username: USER_CREDENTIALS.username,
    });

  userToken = tokenResponse.body.access_token;

  if (!userToken) {
    throw new Error('test user creation fails');
  }

  const provisionResponse = await request(app)
    .post(`/v1/provisioning/${DEVICE_ID}`)
    .query({ access_token: userToken })
    .send({ publicKey: TestData.getPublicKey() });

  deviceToApiAttributes = provisionResponse.body;

  if (!deviceToApiAttributes.id) {
    throw new Error('test device creation fails');
  }
});


test(
  'should return claimCode, and user\'s devices ids',
  async t => {
    const response = await request(app)
      .post(`/v1/device_claims`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: userToken });

    t.is(response.status, 200);
    t.truthy(response.body.claim_code);
    t.truthy(
      response.body.device_ids &&
      response.body.device_ids[0] === DEVICE_ID
    );
  },
);

test.after.always(async (): Promise<void> => {
  await container.constitute('UserRepository').deleteById(testUser.id);
  await container.constitute('DeviceAttributeRepository').deleteById(DEVICE_ID);
  await container.constitute('DeviceKeyRepository').delete(DEVICE_ID);
});
