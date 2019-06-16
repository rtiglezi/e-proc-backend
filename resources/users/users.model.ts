import * as mongoose from 'mongoose'
import * as bcrypt from 'bcrypt'

import { Unit } from '../units/units.model';

import { validateCPF } from '../../common/validators'
import { environment } from '../../common/environment';


/* interface para representar o documento,
   que será útil para poder possibilitar o 
   "autocomplete" e a detecção de erros */
export interface User extends mongoose.Document {
    name: string,
    email: string,
    login: string,
    password: string,
    gender: string,
    cpf: string,
    allowedUnit: [mongoose.Types.ObjectId | Unit],
    lastUnit: mongoose.Types.ObjectId | Unit,
    profiles: string[],
    matches(password: string): boolean,
    hasAny(...profiles: string[]): boolean
}

export interface UserModel extends mongoose.Model<User> {
    findByEmail(email: string, projection?: string): Promise<User>
}


/* schema server para informar ao mongoose
   quais são os metadados do documento */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 80,
        minlength: 3
    },
    email: {
        type: String,
        unique: true,
        required: true,
        match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    login: {
        type: String,
        unique: true,
        required: true,
        maxlength: 30,
        minlength: 10
    },
    password: {
        type: String,
        select: false,
        required: true,
        minlength: 8
    },
    gender: {
        type: String,
        required: false,
        enum: ['Male', 'Female']
    },
    cpf: {
        type: String,
        required: false,
        validate: {
            validator: validateCPF,
            message: '{PATH}: Invalid CPF ({VALUE})'
        }
    },
    allowedUnit: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
        required: false
    }],
    lastUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
        required: false
    },
    profiles :{
        type: [String],
        required: false
    }
})

/* Middlwares do MongoDB:
   de documento:
     - init 
     - validate 
     - save 
     - remove
   de query-model:
     - count()
     - find ()
     - findOne ()
     - findOneAndUpdate()
     - findOneAndRemove()
     - update() */ 

userSchema.statics.findByEmail = function (email: string, projection: string) {
    return this.findOne({ email }, projection) //{email: email}
}

userSchema.methods.matches = function (password: string): boolean {
    return bcrypt.compareSync(password, this.password)
}

userSchema.methods.hasAny = function (...profiles: string[]): boolean {
    return profiles.some(profile => this.profiles.indexOf(profile) !== -1)
}

/* função para aproveitar código nas duas middlewares abaixo */
const hashPassword = (obj, next) => {
    bcrypt.hash(obj.password, environment.security.saltRounds)
        .then(hash => {
            obj.password = hash
            next()
        }).catch(next)
}

const saveMiddleware = function (next) {
    const user: User = this // como é uma middleware de documento, "this" é o próprio documento
    console.log(user)
    if (!user.isModified('password')) {
        next()
    } else {
        hashPassword(user, next)
    }
}

const updateMiddleware = function (next) {
    if (!this.getUpdate().password) { // "this.getUpdate()" se refere ao objeto modificado 
        next()
    } else {
        hashPassword(this.getUpdate(), next)
    }
}

/* middleware para criptografar a senha no momento de inserir */
userSchema.pre('save', saveMiddleware)

/* middleware para criptografar a senha no momento de alterar */
userSchema.pre('findOneAndUpdate', updateMiddleware)
userSchema.pre('update', updateMiddleware)

/* model serve para manipular o documento */
export const User = mongoose.model<User, UserModel>('User', userSchema)