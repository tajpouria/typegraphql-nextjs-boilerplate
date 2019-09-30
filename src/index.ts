import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";

import { UserResolver } from "./modules/user/UserResolver";

(async () => {
    const app = express();

    await createConnection();

    const schema = await buildSchema({ resolvers: [UserResolver] });

    const apolloServer = new ApolloServer({ schema });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("Listening on port 4000...");
    });
})();
