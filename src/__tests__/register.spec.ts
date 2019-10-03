import { Connection } from "typeorm";
import faker from "faker";
import { testConn } from "../test-utils/testConn";
import { gCall } from "../test-utils/gCall";
import { User } from "../entity/User";

describe("RegisterResolver", () => {
    let connection: Connection;
    beforeAll(async () => {
        connection = await testConn();
    });

    afterAll(async () => {
        await connection.close();
    });

    it("register the valid user", async () => {
        const registerMutation = `mutation Register($input: RegisterInput!) {
          register(input: $input) {
            id
            firstName
            lastName
            fullName
            email
            password
            confirmed
          }
        }
        `;

        const person = {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.internet.email(),
            password: faker.internet.password()
        };

        const response = await gCall({
            source: registerMutation,
            variableValues: {
                input: person
            }
        });

        expect(response).toMatchObject({
            data: {
                register: {
                    firstName: person.firstName,
                    lastName: person.lastName,
                    email: person.email,
                    confirmed: false
                }
            }
        });

        const user = await User.findOne({ where: { email: person.email } });
        expect(user).toBeDefined();
    });
});