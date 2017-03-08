// @flow

import type { File } from 'express';

export type Webhook = {
  auth?: { password: string, username: string },
  created_at: Date,
  deviceID?: string,
  errorResponseTopic?: string,
  event: string,
  form?: { [key: string]: Object },
  headers?: { [key: string]: string },
  id: string,
  json?: { [key: string]: Object },
  mydevices?: boolean,
  noDefaults?: boolean,
  ownerID: string,
  productIdOrSlug?: string,
  query?: { [key: string]: Object },
  rejectUnauthorized?: boolean,
  requestType: string,
  responseTemplate?: string,
  responseTopic?: string,
  url: string,
};

export type WebhookMutator = {
  auth?: { password: string, username: string },
  deviceID?: string,
  errorResponseTopic?: string,
  event: string,
  form?: { [key: string]: Object },
  headers?: { [key: string]: string },
  json?: { [key: string]: Object },
  mydevices?: boolean,
  noDefaults?: boolean,
  ownerID: string,
  productIdOrSlug?: string,
  query?: { [key: string]: Object },
  rejectUnauthorized?: boolean,
  requestType: string,
  responseTemplate?: string,
  responseTopic?: string,
  url: string,
};

export type RequestType = 'DELETE' | 'GET' | 'POST' | 'PUT';

export type Client = {
  clientId: string,
  clientSecret: string,
  grants: Array<GrantType>,
};

export type DeviceAttributes = {
  appHash: ?string,
  currentBuildTarget: string,
  deviceID: string,
  imei?: string,
  ip: string,
  isCellular: boolean,
  last_iccid?: string,
  lastHeard: Date,
  name: string,
  ownerID: ?string,
  particleProductId: number,
  productFirmwareVersion: number,
  registrar: string,
  timestamp: Date,
};

export type Event = EventData & {
  ttl: number,
  publishedAt: Date,
};

export type EventData = {
  data?: string,
  deviceID?: ?string,
  isPublic: boolean,
  name: string,
  ttl?: number,
  userID: string,
};

export type GrantType =
  'bearer_token'|
  'password'|
  'refresh_token';

export type TokenObject = {
  accessToken: string,
  accessTokenExpiresAt: Date,
  refreshToken: string,
  refreshTokenExpiresAt: Date,
  scope: string,
};

export type User = {
  accessTokens: Array<TokenObject>,
  created_at: Date,
  id: string,
  passwordHash: string,
  salt: string,
  username: string,
};

export type UserCredentials = {
  username: string,
  password: string,
};

export type Device = DeviceAttributes & {
  connected: boolean,
  functions?: ?Array<string>,
  lastFlashedAppName: ?string,
  variables?: ?Object,
};

export type Repository<TModel> = {
  create: (model: TModel | $Shape<TModel>) => Promise<TModel>,
  deleteById: (id: string) => Promise<void>,
  getAll: () => Promise<Array<TModel>>,
  getById: (id: string) => Promise<?TModel>,
  update: (model: TModel) => Promise<TModel>,
};

export type UserRepository = Repository<User> & {
  createWithCredentials(credentials: UserCredentials): Promise<User>,
  deleteAccessToken(userID: string, accessToken: string): Promise<void>,
  getByAccessToken(accessToken: string): Promise<?User>,
  getByUsername(username: string): Promise<?User>,
  isUserNameInUse(username: string): Promise<boolean>,
  saveAccessToken(userID: string, tokenObject: TokenObject): Promise<User>,
  validateLogin(username: string, password: string): Promise<User>,
};

export type Settings = {
  ACCESS_TOKEN_LIFETIME: number,
  API_TIMEOUT: number,
  BUILD_DIRECTORY: string,
  CRYPTO_SALT: string,
  DEVICE_DIRECTORY: string,
  FIRMWARE_DIRECTORY: string,
  FIRMWARE_REPOSITORY_DIRECTORY: string,
  HOST: string,
  LOG_REQUESTS: boolean,
  LOGIN_ROUTE: string,
  PORT: number,
  SERVER_KEY_FILENAME: string,
  SERVER_KEYS_DIRECTORY: string,
  USERS_DIRECTORY: string,
  WEBHOOKS_DIRECTORY: string,
};

export type DeviceAttributeRepository = Repository<DeviceAttributes> & {
  doesUserHaveAccess(deviceID: string, userID: string): Promise<boolean>,
};

export type DeviceManager = {
  callFunction(
    deviceID: string,
    userID: string,
    functionName: string,
    functionArguments: {[key: string]: string},
  ): Promise<*>,
  claimDevice(deviceID: string, userID: string): Promise<DeviceAttributes>,
  flashBinary(deviceID: string, files: File): Promise<*>,
  flashKnownApp(deviceID: string, userID: string, app: string): Promise<*>,
  getAll(userID: string): Promise<Array<Device>>,
  getByID(deviceID: string, userID: string): Promise<Device>,
  getDetailsByID(deviceID: string, userID: string): Promise<*>,
  getVariableValue(deviceID: string, userID: string, varName: string): Promise<Object>,
  provision(deviceID: string, userID: string, publicKey: string): Promise<*>,
  raiseYourHand(deviceID: string, userID: string, shouldShowSignal: boolean): Promise<void>,
  renameDevice(deviceID: string, userID: string, name: string): Promise<DeviceAttributes>,
  unclaimDevice(deviceID: string, userID: string): Promise<DeviceAttributes>,
};

export type RequestOptions = {
  auth?: { password: string, username: string },
  body: ?Object,
  form: ?Object,
  headers: ?Object,
  json: boolean,
  method: RequestType,
  qs: ?Object,
  strictSSL?: boolean,
  url: string,
};

export type Product = {
  config_id: string,
  description: string,
  hardware_version: string,
  id: string,
  name: string,
  organization: string,
  product_id: number,
  requires_activation_codes: boolean,
  slug: string,
  type: 'Consumer' | 'Hobbyist' | 'Industrial',
}
