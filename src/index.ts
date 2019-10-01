import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import cors from "cors";
import session from "express-session";
import connectRedis from "connect-redis";

import { UserResolver } from "./modules/user/UserResolver";
import { redis } from "./redis";
import { LoginResolver } from "./modules/user/LoginResolver";
import { MeResolver } from "./modules/user/MeResolver";
import { ConfirmUserResolver } from "./modules/user/ConfirmUserResolver";

const RedisStore = connectRedis(session);

(async () => {
    const app = express();

    app.use(cors({ credentials: true, origin: "http:// localhost:3000" }));

    app.use(
        session({
            store: new RedisStore({ client: redis as any }),
            name: "qid",
            secret: "cat keyboard",
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 1000 * 60 * 60 * 24 * 7 * 365 // 7 year
            }
        })
    );

    await createConnection();

    const schema = await buildSchema({
        resolvers: [UserResolver, LoginResolver, MeResolver, ConfirmUserResolver]
    });

    const apolloServer = new ApolloServer({
        schema,
        context: ({ req }) => ({ req })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, async () => {
        console.log("Listening on port 4000...");
    });
})();
