// @flow

import type { Device, DeviceManager } from '../types';
import type { DeviceAPIType } from '../lib/deviceToAPI';

import nullthrows from 'nullthrows';
import Controller from './Controller';
import HttpError from '../lib/HttpError';
import FirmwareCompilationManager from '../managers/FirmwareCompilationManager';
import allowUpload from '../decorators/allowUpload';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import deviceToAPI from '../lib/deviceToAPI';

type CompileConfig = {
  platform_id?: string,
  product_id?: string,
};

class DevicesController extends Controller {
  _deviceManager: DeviceManager;

  constructor(deviceManager: DeviceManager) {
    super();

    this._deviceManager = deviceManager;
  }

  @httpVerb('post')
  @route('/v1/devices')
  async claimDevice(postBody: { id: string }): Promise<*> {
    const deviceID = postBody.id;
    await this._deviceManager.claimDevice(deviceID, this.user.id);

    return this.ok({ ok: true });
  }

  @httpVerb('get')
  @route('/v1/binaries/:binaryID')
  async getAppFirmware(binaryID: string): Promise<*> {
    return this.ok(FirmwareCompilationManager.getBinaryForID(binaryID));
  }

  @httpVerb('post')
  @route('/v1/binaries')
  @allowUpload()
  async compileSources(postBody: CompileConfig): Promise<*> {
    const response = await FirmwareCompilationManager.compileSource(
      nullthrows(postBody.platform_id || postBody.product_id),
      (this.request.files: any),
    );

    if (!response) {
      throw new HttpError('Error during compilation');
    }

    return this.ok({
      ...response,
      binary_url: `/v1/binaries/${response.binary_id}`,
      ok: true,
    });
  }

  @httpVerb('delete')
  @route('/v1/devices/:deviceID')
  async unclaimDevice(deviceID: string): Promise<*> {
    await this._deviceManager.unclaimDevice(deviceID, this.user.id);
    return this.ok({ ok: true });
  }

  @httpVerb('get')
  @route('/v1/devices')
  async getDevices(): Promise<*> {
    try {
      const devices = await this._deviceManager.getAll(this.user.id);
      return this.ok(devices.map((device: Device): DeviceAPIType =>
        deviceToAPI(device)),
      );
    } catch (error) {
      // I wish we could return no devices found but meh :/
      return this.ok([]);
    }
  }

  @httpVerb('get')
  @route('/v1/devices/:deviceID')
  async getDevice(deviceID: string): Promise<*> {
    const device = await this._deviceManager.getDetailsByID(
      deviceID,
      this.user.id,
    );
    return this.ok(deviceToAPI(device));
  }

  @httpVerb('get')
  @route('/v1/devices/:deviceID/:varName/')
  async getVariableValue(
    deviceID: string,
    varName: string,
  ): Promise<*> {
    try {
      const varValue = await this._deviceManager.getVariableValue(
        deviceID,
        this.user.id,
        varName,
      );

      return this.ok({ result: varValue });
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.match('Variable not found')) {
        throw new HttpError('Variable not found', 404);
      }
      throw error;
    }
  }

  @httpVerb('put')
  @route('/v1/devices/:deviceID')
  @allowUpload('file', 1)
  async updateDevice(
    deviceID: string,
    postBody: {
      app_id?: string,
      name?: string,
      file_type?: 'binary',
      signal?: '1' | '0',
    },
  ): Promise<*> {
    // 1 rename device
    if (postBody.name) {
      const updatedAttributes = await this._deviceManager.renameDevice(
        deviceID,
        this.user.id,
        postBody.name,
      );
      return this.ok({ name: updatedAttributes.name, ok: true });
    }

    // 2 flash device with known application
    if (postBody.app_id) {
      const flashStatus = await this._deviceManager.flashKnownApp(
        deviceID,
        this.user.id,
        postBody.app_id,
      );

      return this.ok({ id: deviceID, status: flashStatus });
    }

    // 3 flash device with custom application
    if (this.request.files && !(this.request.files: any).file) {
      throw new Error('Firmware file not provided');
    }

    const file =
      this.request.files &&
      (this.request.files: any).file[0];

    if (file && file.originalname.endsWith('.bin')) {
      const flashStatus = await this._deviceManager
        .flashBinary(deviceID, file);

      return this.ok({ id: deviceID, status: flashStatus });
    }

    // 4
    // If signal exists then we want to toggle nyan mode. This just makes the
    // LED change colors.
    if (postBody.signal) {
      if (!['1', '0'].includes(postBody.signal)) {
        throw new HttpError('Wrong signal value');
      }

      await this._deviceManager.raiseYourHand(
        deviceID,
        this.user.id,
        !!parseInt(postBody.signal, 10),
      );

      return this.ok({ id: deviceID, ok: true });
    }

    throw new HttpError('Did not update device');
  }

  @httpVerb('post')
  @route('/v1/devices/:deviceID/:functionName')
  async callDeviceFunction(
    deviceID: string,
    functionName: string,
    postBody: Object,
  ): Promise<*> {
    try {
      const result = await this._deviceManager.callFunction(
        deviceID,
        this.user.id,
        functionName,
        postBody,
      );

      const device = await this._deviceManager.getByID(
        deviceID,
        this.user.id,
      );
      return this.ok(deviceToAPI(device, result));
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.indexOf('Unknown Function') >= 0) {
        throw new HttpError('Function not found', 404);
      }
      throw error;
    }
  }
}

export default DevicesController;
