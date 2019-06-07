import {ModelRouter} from './../common/model.router'
import * as restify from 'restify'
import {User} from './users.model'
import {authenticate} from '../security/auth.handler'
import { authorize } from './../security/authz.handler';

class UsersRouter extends ModelRouter<User> {

    constructor(){
        super(User)
        /* método "beforeRender" criado no 
           router.ts */
        this.on('beforeRender', document=>{
            // modificando o documento
            document.password = undefined
            /* para não mostrar a senha
               após o post de criação de
               novo usuário */
        })
    }

    // findById = (req, resp, next) => {
    //     this.model.findById(req.params.id)
    //               .populate("unit", "name")
    //               .then(this.render(resp,next))
    //               .catch(next)
    // }

    findByEmail = (req, resp, next)=>{
        if(req.query.email){
          User.findByEmail(req.query.email)
              .then(user => user ? [user] : [])
              .then(this.renderAll(resp, next, {
                    pageSize: this.pageSize,
                    url: req.url
                  }))
              .catch(next)
        }else{
          next()
        }
      }


    applyRoutes(application: restify.Server) {
        application.get(`${this.basePath}`, [authorize('admin'), this.findByEmail, this.findAll])
        application.get(`${this.basePath}/:id`, [authorize('admin'), this.validateId, this.findById])
        application.post(`${this.basePath}`, [authorize('admin'), this.save])
        application.put(`${this.basePath}/:id`, [authorize('admin'), this.validateId, this.replace])
        application.patch(`${this.basePath}/:id`, [authorize('admin'), this.validateId, this.update])
        application.del(`${this.basePath}/:id`, [authorize('admin'), this.validateId, this.delete])

        application.post(`${this.basePath}/authenticate`, authenticate)
    }
}

/* instanciar esta classe e disponibilizá-la para
   que outras partes da aplicação possam utilizar,
   por exemplo na invocação do método "bootstrap"
   no arquivo main.ts */ 
export const usersRouter = new UsersRouter()