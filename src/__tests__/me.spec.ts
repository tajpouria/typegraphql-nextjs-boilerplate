import { Connection } from "typeorm";
import faker from "faker";
import { testConn } from "../test-utils/testConn";
import { gCall } from "../test-utils/gCall";
import { User } from "../entity/User";

describe("MeResolver", () => {
    let connection: Connection;
    beforeAll(async () => {
        connection = await testConn();
    });

    afterAll(async () => {
        await connection.close();
    });

    it("returns the user if userId is available in request session", async () => {
        const meQuery = `query Me {
   me {
     id
     firstName
     lastName
     fullName
     email
     password
     confirmed
   }
 }`;

        const user = await User.create({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.internet.email(),
            password: faker.internet.password()
        }).save();

        const response = await gCall({ source: meQuery, userId: user.id });

        expect(response).toMatchObject({
            data: {
                me: {
                    id: user.id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                }
            }
        });
    });

    it("returns null if userId is NOT available in request session", async () => {
        const meQuery = `query Me {
   me {
     id
     firstName
     lastName
     fullName
     email
     password
     confirmed
   }
 }`;

        const response = await gCall({ source: meQuery });

        expect(response).toMatchObject({
            data: {
                me: null
            }
        });
    });
});
