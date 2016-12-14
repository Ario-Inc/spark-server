// @flow

import type {
  UserCredentials,
  UserRepository,
} from '../../types';

import basicAuthParser from 'basic-auth-parser';
import Controller from './Controller';
import HttpError from '../HttpError';
import anonymous from '../decorators/anonymous';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';

class UsersController extends Controller {
  _userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    super();
    this._userRepository = userRepository;
  }

  @httpVerb('post')
  @route('/v1/users')
  @anonymous()
  async createUser(userCredentials: UserCredentials): Promise<*> {
    try {
      const isUserNameInUse =
        this._userRepository.isUserNameInUse(userCredentials.username);

      if (isUserNameInUse) {
        throw new HttpError('user with the username is already exist');
      }

      const newUser = await this._userRepository.createWithCredentials(
        userCredentials,
      );
      return this.ok(newUser);
    } catch (error) {
      return this.bad(error.message);
    }
  }

  @httpVerb('delete')
  @route('/v1/access_tokens/:token')
  @anonymous()
  async deleteAccessToken(token: string): Promise<*> {
    const { username, password } = basicAuthParser(
      this.request.get('authorization'),
    );
    const user = await this._userRepository.validateLogin(
      username,
      password,
    );

    this._userRepository.deleteAccessToken(user, token);

    return this.ok({ ok: true });
  }

  @httpVerb('get')
  @route('/v1/access_tokens')
  @anonymous()
  async getAccessTokens(): Promise<*> {
    const { username, password } = basicAuthParser(
      this.request.get('authorization'),
    );
    const user = await this._userRepository.validateLogin(username, password);
    return this.ok(user.accessTokens);
  }
}

export default UsersController;
