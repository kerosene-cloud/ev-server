import express, { NextFunction, Request, Response } from 'express';

import AuthService from '../../service/AuthService';
import RouterUtils from '../RouterUtils';
import { ServerAction } from '../../../../../types/Server';

export default class AuthRouter {
  private router: express.Router;

  public constructor() {
    this.router = express.Router();
  }

  public buildRoutes(): express.Router {
    this.buildRouteSignIn();
    this.buildRouteSignOn();
    this.buildRouteSignOut();
    this.buildRoutePasswordReset();
    this.buildRouteVerifyMail();
    this.buildRouteResendVerificationMail();
    this.buildRouteCheckEndUserLicenseAgreement();
    return this.router;
  }

  protected buildRouteSignIn(): void {
    this.router.post(`/${ServerAction.REST_SIGNIN}`, async (req: Request, res: Response, next: NextFunction) => {
      await RouterUtils.handleServerAction(AuthService.handleLogIn.bind(this), ServerAction.REST_SIGNIN, req, res, next);
    });
  }

  protected buildRouteSignOn(): void {
    this.router.post(`/${ServerAction.REST_SIGNON}`, async (req: Request, res: Response, next: NextFunction) => {
      await RouterUtils.handleServerAction(AuthService.handleRegisterUser.bind(this), ServerAction.REST_SIGNON, req, res, next);
    });
  }

  protected buildRouteSignOut(): void {
    this.router.get(`/${ServerAction.REST_SIGNOUT}`, async (req: Request, res: Response, next: NextFunction) => {
      await RouterUtils.handleServerAction(AuthService.handleUserLogOut.bind(this), ServerAction.REST_SIGNOUT, req, res, next);
    });
  }

  protected buildRoutePasswordReset(): void {
    this.router.post(`/${ServerAction.REST_PASSWORD_RESET}`, async (req: Request, res: Response, next: NextFunction) => {
      await RouterUtils.handleServerAction(AuthService.handleUserPasswordReset.bind(this), ServerAction.REST_PASSWORD_RESET, req, res, next);
    });
  }

  protected buildRouteResendVerificationMail(): void {
    this.router.post(`/${ServerAction.REST_RESEND_VERIFICATION_EMAIL}`, async (req: Request, res: Response, next: NextFunction) => {
      await RouterUtils.handleServerAction(AuthService.handleResendVerificationEmail.bind(this), ServerAction.REST_RESEND_VERIFICATION_EMAIL, req, res, next);
    });
  }

  protected buildRouteVerifyMail(): void {
    this.router.get(`/${ServerAction.REST_VERIFY_EMAIL}`, async (req: Request, res: Response, next: NextFunction) => {
      await RouterUtils.handleServerAction(AuthService.handleVerifyEmail.bind(this), ServerAction.REST_VERIFY_EMAIL, req, res, next);
    });
  }

  protected buildRouteCheckEndUserLicenseAgreement(): void {
    this.router.post(`/${ServerAction.REST_CHECK_USER_LICENSE_AGREEMENT}`, async (req: Request, res: Response, next: NextFunction) => {
      await RouterUtils.handleServerAction(AuthService.handleVerifyEmail.bind(this), ServerAction.REST_CHECK_USER_LICENSE_AGREEMENT, req, res, next);
    });
  }
}
