import { Router } from './common/router'
import * as restify from 'restify'
import { authorize } from './security/authz.handler';

class MainRouter extends Router {
  applyRoutes(application: restify.Server) {
    application.get('/',
      [authorize('user'),
      (req, resp, next) => {
        resp.json({
          users: '/users',
          units: '/units'
        })
      }])
  }
}

export const mainRouter = new MainRouter()
