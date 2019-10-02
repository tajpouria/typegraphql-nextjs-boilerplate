import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import cors from "cors";
import session from "express-session";
import connectRedis from "connect-redis";

import { redis } from "./redis";

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
        resolvers: [__dirname + "/modules/**/*.ts"]
    });

    const apolloServer = new ApolloServer({
        schema,
        context: ({ req, res }) => ({ req, res })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, async () => {
        console.log("Listening on port 4000...");
    });
})();
