import { createConnection } from "typeorm";

export const testConn = (drop: boolean = false) => {
    return createConnection({
        type: "postgres",
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "postgres",
        database: "typegraphql_series_test",
        synchronize: drop,
        dropSchema: drop,
        entities: [__dirname + "/../entity/*.*"]
    });
};
