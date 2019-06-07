"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server/server");
const users_router_1 = require("./users/users.router");
const units_router_1 = require("./units/units.router");
// instanciar a classe Server
const server = new server_1.Server();
/* Invocar o método "bootstrap", que está na classe "Server"
   e que iniciará a aplicação. Este método receberá as instâncias
   das rotas à medida que elas forem sendo exportadas por suas
   respectivas classes, como ocorre com a classe UsersRouters. */
server.bootstrap([
    users_router_1.usersRouter,
    units_router_1.unitsRouter
]).then(server => {
    console.log('Server is listening on:', server.application.address());
}).catch(error => {
    console.log('Server failed to start');
    console.error(error);
    process.exit(1); //codigo 1 indica uma saída anormal do programa
});
