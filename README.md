# Type GraphQL Series Integrated with NextJS

A quick introduction to [type-graphql](https://github.com/MichalLytek/type-graphql) library with NextJS

## Bootstrap with apollo-server-graphql

### installing

> yarn add reflect-metadata graphql type-graphql

### bootstrapping

```typescript
import { buildSchema, Resolver, Query } from "type-graphql";

@Resolver()
class HelloResolver {
    @Query(() => String, { name: "hello", nullable: true })
    async hello() {
        return "hello world";
    }
}

(async () => {
    const app = express();

    const schema = await buildSchema({
        resolver: [__dirname + "/modules/**/*.ts"]
        // resolvers: [HelloResolver]
    });

    const apolloServer = new ApolloServer({ schema });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("Listening on port 4000...");
    });
})();
```

## write mutation

```typescript
@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column("text")
    firstName: string;

    @Field()
    @Column("text")
    lastName: string;

    @Field()
    fullName: string;

    @Field()
    @Column("text", { unique: true })
    email: string;

    @Field()
    @Column("text")
    password: string;

    @BeforeInsert()
    async hashPassword() {
        const hashedPassword = await hash(this.password, 12);
        this.password = hashedPassword;
    }
}
```

```typescript
@Resolver(User) // specified as @root
export class UserResolver {
    @Query(() => String)
    hello(): string {
        return "Hello from user";
    }

    @Mutation(() => User) // it is possible cuz we defined User Entity as an Object type.
    async register(
        @Arg("firstName") firstName: string,
        @Arg("lastName") lastName: string,
        @Arg("email") email: string,
        @Arg("password") password: string
    ): Promise<User> {
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        }).save();

        return user;
    }

    @resolveField(() => String) // it 's useful to query on fields that not specified as Entity Column
    fullName(@Root parent: User) {
        return `${parent.firstName} ${parent.lastName}`;
    }
}
```

_there is also a shorter way to **resolve fields** directly on entity_

./entity/User.ts

```typescript
@Entity()
export class User extends BaseEntity {
    // other class @Column()

    @Field()
    fullName(@Root() parent: User): string {
        return `${parent.firstName} ${parent.lastName}`;
    }
}
```

## Validation

### defining an @inputType and use it as @Arg

> yarn add class-validator

./modules/user/register/RegisterInput.ts

```typescript
import { Length, isEmail } from "class-validation";

@InputType()
export class RegisterInput {
    @Field()
    @Length(3, 255)
    firstName: string;

    @Field()
    @Length(3, 255)
    lastName: string;

    @Field()
    @isEmail()
    email: string;

    @Field()
    password: string;
}
```

./modules/user/register/userResolver

```typescript
@Resolver()
export class UserResolver {
    @Mutation(() => User)
    register(@Arg("input")
    {
        firstName,
        lastName,
        email,
        password
    }: RegisterInput): Promise<User> {
        // doing register stuff
    }
}
```

here is how args looks like:

```graphql
mutation Register {
    register(input: {firstName, lastName, email, password}){
        id
        .
        .
        .
    }
}
```

## login and persist session on redis

### store express sessions on redis

> yarn add express-session connect-redis ioredis cors
> yarn add -D @types/express-session @types/connect-redis @types/ioredis @types/core

```typescript
import session from "express-session";
import connectRedis from "redis-store";
import Redis from "ioredis";

const RedisStore = connectRedis(session);

const redis = new Redis();

(() => {
    const app = express();

    app.use(cors({ credentials: true, origin: "http://localhost:4000" }));

    app.use(
        session({
            store: new RedisStore({
                client: redis as any
            }),
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

    // If application using apollo-server-express applyMiddleware it s also important to setup session middleware _before_ apply app as middleware e.g.

    apolloServer.applyMiddleware({ app });
})();
```

### LoginResolver and MeResolver

./modules/user/LoginResolver

```typescript
interface MyContext {
    req: Request;
}

@Resolver()
export class LoginResolver {
    @Mutation(() => User, { nullable: true })
    async login(
        @Arg("input")
        { email, password }: LoginInput,
        @Ctx() ctx: MyContext // accessing context
    ): Promise<User | null> {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error("User not found");
            return null;
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
            console.error("invalid password");
            return null;
        }

        ctx.req.session!.userId = user.id;

        return user;
    }
}
```

./modules/user/LoginResolver

```typescript
@Resolver()
export class MeResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() ctx: MyContext): Promise<User | undefined> {
        const userId = ctx.req.session!.userId;
        if (!userId) {
            return undefined;
        }

        const user = await User.findOne(userId);

        return user;
    }
}
```

## Middleware

### @Authorized()

```typescript
import {@Authorized } from 'type-graphql'

@Resolver()
export class ProtectedHelloResolver {
    @Query(() => String, { nullable: true })
    @Authorized()
    hello() {
        return "hello";
    }
}
(async() => {

    const schema = await buildSchema({
        resolvers: [UserResolver, LoginResolver, MeResolver],
        authChecker({ context }: { context: MyContext }) {
            if (!context.req.session!.userId) {
                return false;
            }
            return true;
        }
    });
})()
```

### Custom Middleware

./modules/middleware/IsAuth.ts

```typescript
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../../types/MyContext";

export const IsAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
    if (!context.req.session!.userId) {
        throw new Error("Not Authorized!");
    }
    return next();
};
```

./modules/userResolver.ts

```typescript
@Resolver()
export class UserResolver {
    @Query(() => String)
    @UseMiddleware(IsAuth)
    hello(): string {
        return "hello user";
    }

    /* 
    .
    .
    .
    */
}
```

## Confirm User using Confirmation Email with nodemailer

### confirmation @Column on @Entity and forbid not confirmed user to login

./entity/User.ts

```typescript
@ObjectType()
@Entity()
export class User extends BaseEntity {
    /* 
    .
    .
    .
    */
    @Field()
    @Column("bool", { default: false })
    confirmed: boolean;
}
```

./modules/user/loginResolver.ts

```typescript
@Resolver()
export class LoginResolver {
    @Mutation(() => User, { nullable: true })
    async login(
        @Arg("input")
        { email, password }: LoginInput,
        @Ctx() ctx: MyContext
    ): Promise<User | null> {
        /*
        .
        .
        .
        */
        if (!user.confirmed) {
            console.error("User not confirmed");
            return null;
        }
        /*
        .
        .
        .
        */
    }
}
```

### install in setting up nodemailer sendingEmail function

> yarn add nodemailer
> yarn add -D nodemailer

./modules/utils/sendConfirmationEmail.ts

```typescript
import nodemailer from "nodemailer";

export async function sendConfirmationEmail(
    email: string,
    confirmationLink: string
) {
    const testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });

    const info = await transporter.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>', // sender address
        to: "bar@example.com, baz@example.com", // list of receivers
        subject: "Confirmation ✔", // Subject line
        text: "Hello world?", // plain text body
        html: `<a href="${confirmationLink}">${confirmationLink}</a>` // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
```

### modify register to set token and send confirmation email

./modules/user/userResolver.ts

```typescript
import { v4 } from "uuid";
import { redis } from "../../redis";
import { sendConfirmationEmail } from "../utils/sendConfirmationEmail";

const createAndSetConfirmationLink = async (userId: number) => {
    const token = v4();

    await redis.set(token, userId, "ex", 60 * 60 * 24); // *** expiration in 1 day

    return `http://localhost:3000/${token}`;
};

@Resolver()
export class UserResolver {
    @Mutation(() => User)
    async register(@Arg("input")
    {
        firstName,
        lastName,
        email,
        password
    }: RegisterInput): Promise<User> {
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        }).save();

        const confirmationLink = await createAndSetConfirmationLink(user.id);
        await sendConfirmationEmail(email, confirmationLink);

        return user;
    }
}
```

### confirmUserResolver

./modules/user/confirmUserResolver.ts

```typescript
@Resolver()
export class ConfirmUserResolver {
    @Mutation(() => Boolean)
    async confirm(@Arg("token") token: string): Promise<boolean> {
        const userId = await redis.get(token);

        if (!userId) {
            return false;
        }

        await redis.del(token); // *** delete stored token
        await User.update(userId, { confirmed: true });

        return true;
    }
}
```

## logout

./modules/LogoutResolver.ts

```typescript
@Resolver()
export class LogoutResolver {
    @Mutation(() => Boolean)
    async logout(@Ctx() ctx: MyContext): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // destroy the session
            ctx.req.session!.destroy(err => {
                if (err) {
                    console.error(err);
                    reject(false);
                }

                ctx.res.clearCookie("qid"); // clear the cookie
                resolve(true);
            });
        });
    }
}
```

### inputMixin

./modules/shared/PasswordMixin.ts

```typescript
import { ClassType, InputType, Field } from "type-graphql";
import { MinLength } from "class-validator";

export const PasswordMixin = <T extends ClassType>(BaseClass: T) => {
    @InputType({ isAbstract: true }) // Error: Schema must contain unique named types but contains multiple types named
    class PasswordInput extends BaseClass {
        @Field()
        @MinLength(3)
        password: string;
    }

    return PasswordInput;
};
```

./modules/login/LoginInput.ts

```typescript
import { PasswordMixin } from "../shared/PasswordMixin";

@InputType()
export class LoginInput extends PasswordMixin(class {}) {
    // Instead of class {} you can place whenever input class you want (basic nesting extension)
    @Field()
    @IsEmail()
    email: string;
}
```

:4000/graphql

```graphql
type LoginInput {
    password: String! # added by extends
    email: String!
}
```

## Testing Resolvers

### setup test environment

-   install dependencies
    > yarn add --dev jest typescript ts-jest @types/jest
-   generate jest.config.jes
    > yarn ts-jest config:init

./ jest.config.js

```javascript
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    forceExit: true,
    verbose: true,
    setupFilesAfterEnv: ["./jest.setup.js"] // this file added manually because integration test take a while to resolve
};
```

./jest.setup.js

```javascript
jest.setTimeout(30000);
```

-   adding create connection script

src/test-utils/testConn.ts

```typescript
export const testConn = (drop: boolean = false) => {
    createConnection({
{
        type: "postgres",
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "postgres",
        database: "typegraphql_series_test",
        synchronize: drop,
        dropSchema: drop, // drop drop database tables then connect
        entities: [__dirname + "/../entity/*.*"] // path to entities
    })
}
```

src/test-utils/setup.ts

```typescript
testConn(true).then(() => process.exit());
```

./package.json

```json
{
    "script": {
        "setup:db": "yarn ts-node src/test-utils/setup.ts",
        "test": "yarn run setup:db && jest --detectOpenHandles"
    }
}
```

### writing tests

following contains two integration tests, using direct call graphql schema

./test-utils/gCall.ts

```typescript
import { graphql, GraphQLSchema } from "graphql";
import Maybe from "graphql/tsutils/Maybe";

import { createSchema } from "../createSchema";

interface Options {
    source: string;
    variableValues?: Maybe<{
        [key: string]: any;
    }>;
    userId?: number;
}

let schema: GraphQLSchema;

export const gCall = async ({ source, variableValues, userId }: Options) => {
    if (!schema) {
        schema = await createSchema(); // type-graphql await buildSchema({ resolvers })
    }

    return graphql({
        schema,
        source, // Query or Mutation : string
        variableValues,
        contextValue: {
            // query context
            req: {
                session: { userId }
            },
            res: {
                clearCookie: jest.fn()
            }
        }
    });
};
```

src/\_\_tests\_\_/register.spec.ts

```typescript
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
```

src/\_\_tests\_\_/me.spec.ts

```typescript
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
```

## Higher Order Resolvers (resolver factory)

src/modules/GenericResolver/CreateResover

```typescript
import {
    ClassType,
    Resolver,
    Mutation,
    Arg,
    UseMiddleware
} from "type-graphql";
import { Middleware } from "type-graphql/dist/interfaces/Middleware";

export const createCreateResolver = <T extends ClassType, K extends ClassType>(
    suffix: string,
    ReturnType: T,
    InputType: K,
    Entity: any,
    middleware?: Middleware<any>[]
) => {
    @Resolver()
    class BaseResolver {
        @Mutation(() => ReturnType, { name: `create${suffix}` })
        @UseMiddleware(...(middleware || []))
        async create(@Arg("input", () => InputType) input: any) {
            return await Entity.create(input).save();
        }
    }
    return BaseResolver;
};
```

src/modules/user/createUserResolver

```typescript
import { createCreateResolver } from "../GenericResolver/CreateResolver";
import { User } from "../../entity/User";
import { RegisterInput } from "../user/register/RegisterInput";

export const CreateUser = createCreateResolver(
    "User",
    User,
    RegisterInput,
    User
);
```

## Query Complexity

**Query complexity** is a tactic that can be addded to a graphql server to prevent abuse.
specifically prevent user from sending too much query that make server crash or slow down.

> yarn add graphql-query-complexity

src/index.ts

```typescript
import {
    getComplexity,
    fieldConfigEstimator,
    simpleEstimator
} from "graphql-query-complexity";
import { separateOperations } from "graphql";

const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
    plugins: [
        {
            requestDidStart: () => ({
                didResolveOperation({ request, document }) {
                    /**
                     * This provides GraphQL query analysis to be able to react on complex queries to your GraphQL server.
                     * This can be used to protect your GraphQL servers against resource exhaustion and DoS attacks.
                     * More documentation can be found at https://github.com/ivome/graphql-query-complexity.
                     */
                    const complexity = getComplexity({
                        // Our built schema
                        schema,
                        // To calculate query complexity properly,
                        // we have to check if the document contains multiple operations
                        // and eventually extract it operation from the whole query document.
                        query: request.operationName
                            ? separateOperations(document)[
                                  request.operationName
                              ]
                            : document,
                        // The variables for our GraphQL query
                        variables: request.variables,
                        // Add any number of estimators. The estimators are invoked in order, the first
                        // numeric value that is being returned by an estimator is used as the field complexity.
                        // If no estimator returns a value, an exception is raised.
                        estimators: [
                            // Using fieldConfigEstimator is mandatory to make it work with type-graphql.
                            fieldConfigEstimator(),
                            // Add more estimators here...
                            // This will assign each field a complexity of 1
                            // if no other estimator returned a value.
                            simpleEstimator({ defaultComplexity: 1 })
                        ]
                    });
                    // Here we can react to the calculated complexity,
                    // like compare it with max and throw error when the threshold is reached.
                    if (complexity >= 10) {
                        throw new Error(
                            `Sorry, too complicated query! ${complexity} is over 10 that is the max allowed complexity.`
                        );
                    }
                    // And here we can e.g. subtract the complexity point from hourly API calls limit.
                    console.log("Used query complexity points:", complexity);
                }
            })
        }
    ]
});
```

src/modules/usersResolvers.ts

```typescript
@Resolver()
export class UsersResolver{
    @Query(() => User, {complexity : 4}) // this complexity option will added to server complexity then try to resolve
    /*
    .
    .
    .
     */
}
```

e.g.

```graphql
# Query
query {
  users {
    id
    firstName
    lastName
    fullName
    email
    password
    confirmed
  }
}


# Result
{
  "error": {
    "errors": [
      {
        "message": "Sorry, too complicated query! 12 is over 10 that is the max allowed complexity."
      }
    ]
  }
}
```

<hr/>

### setup next_with_typescript_example

> npx create-next-app --example with-typescript web
> yarn yarn upgrade --interative

### setup next_with_apollo_client_auth

https://github.com/zeit/next.js/blob/canary/examples/with-apollo-auth/lib/apollo.js

## Introduction to [ Formik ](https://jaredpalmer.com/formik/)

> yarn add formik

_yup for validation_

> yarn add yup

### withFormik basics

```jsx
import { withFormik } from "formik";

const myForm = ({email, handleChange, onSubmit}) => {
    return(
      <form onSubmit={handleSubmit}>
            <input
                name="email"
                placeholder="email"
                onChange={handleChange}
                value={email}
            />
      </form >
    )
}

export default withFormik({
    mapPropsToValues() {
        return {
            email: "",
            password: ""
        },
   onSubmit(values){
       console.log(values)
   }
    }
})(MyForm);
```

### using Form and Field

```jsx
import { Form, withFormik, Field } from "formik";

const FormikIntro = ({ values }) => {
    return (
        <Form>
            <Field name="email" type="email" placeholder="email" />
            <Field name="password" type="password" placeholder="placeholder=" />
            <label htmlFor="checkBox">
                <Field name="rules" type="checkBox" checked={values.rules} />I
                agree all rules.
            </label>
            <Field name="plan" component="select">
                <option value="free">Free</option>
                <option value="premium">Premium</option>
            </Field>
            <button type="submit">Submit</button>
        </Form>
    );
};

export default withFormik({
    mapPropsToValues() {
        return { email: "", password: "", rules: true, plan: "free" };
    },
    handleSubmit(values) {
        console.table(values);
    }
})(FormikIntro);
```

### validation using [ Yup ](https://github.com/jquense/yup) and errorHandling

```jsx
import { Form, withFormik, Field } from "formik";
import { object, string } from "yup";

const FormikIntro = ({ values, touched, errors, isSubmitting }) => {
    return (
        <Form>
            {touched.email && errors.email && <p>{errors.email}</p>}
            <Field name="email" type="email" placeholder="email" />
            {touched.password && errors.password && <p>{errors.password}</p>}
            <Field name="password" type="password" placeholder="placeholder=" />
            <label htmlFor="checkBox">
                <Field name="rules" type="checkBox" checked={values.rules} />I
                agree all rules.
            </label>
            <Field name="plan" component="select">
                <option value="free">Free</option>
                <option value="premium">Premium</option>
            </Field>
            <button disabled={isSubmitting} type="submit">
                Submit
            </button>
        </Form>
    );
};

export default withFormik({
    mapPropsToValues() {
        return { email: "", password: "", rules: true, plan: "free" };
    },
    handleSubmit(values, { setError, resetForm, setSubmitting }) {
        console.table(values);
        setTimeout(() => {
            if (email === "givenEmail@gmail.com") {
                setError({ email: "Email is already given" });
            }
            resetForm();
            setSubmitting(false);
        }, 2000);
    },
    validationSchema: object().shape({
        email: string()
            .email("Email not valid")
            .required("Email is required"),
        password: string()
            .min(9, "Password must be 9 character or longer")
            .required("Password is required")
    })
})(FormikIntro);
```

### passing props methods

./components/fields/InputField.tsx

```typescript
import { FieldProps } from "formik";

type InputProps = React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
>;

export const InputField: React.FC<FormikProps & InputProps> = ({
    form,
    field,
    props
}) => {
    const errorMessage = touched[field.name] && errors[field.name];

    return <input {...fields} {...props} />;
};
```

./pages/register.tsx

```typescript
import * as React from "react";
import { Formik, Form, Field } from "formik";
import Layout from "../components/Layout";
import { useRegisterMutation } from "../generated/graphql";
import { withApollo } from "../lib/apollo";

const RegisterPage: React.FC = () => {
    const [register] = useRegisterMutation();
    const handleSubmit = React.useCallback(async values => {
        const response = await register({ variables: { input: values } });
        console.log(response);
    }, []);

    return (
        <Formik
            initialValues={{
                firstName: "",
                lastName: "",
                email: "",
                password: ""
            }}
            onSubmit={handleSubmit}
        >
            {() => (
                {({ isSubmitting }) => (
                <Layout title="Register">
                    <Form>
                        <div>
                            <Field
                                name="firstName"
                                placeholder="firstName"
                                component={InputField}
                            />
                        </div>
                        <div>
                            <Field
                                name="lastName"
                                placeholder="lastName"
                                component={InputField}
                            />
                        </div>
                        <div>
                            <Field
                                name="email"
                                type="email"
                                placeholder="email"
                                component={InputField}
                            />
                        </div>
                        <div>
                            <Field
                                name="password"
                                type="password"
                                placeholder="password"
                                component={InputField}
                            />
                        </div>
                        <button disabled={isSubmitting} type="submit">
                            Submit
                        </button>
                    </Form>
                </Layout>
            )}
            )}
        </Formik>
    );
};

export default withApollo(RegisterPage);
```

## Handling ApolloClient errors with Formik

```typescript
const handleSubmit = React.useCallback(
    async (values, { setErrors, setSubmitting }) => {
        setSubmitting(true);
        try {
            await register({ variables: { input: values } });
            setSubmitting(false);
        } catch (err) {
            const errors: { [key: string]: string } = {};
            err.graphQLErrors[0].extensions.exception.validationErrors.forEach(
                ({
                    property,
                    constraints
                }: {
                    property: string;
                    constraints: { [key: string]: string };
                }) => {
                    errors[property] = Object.values(constraints)[0];
                }
            );

            setErrors(errors);
            setSubmitting(false);
        }
    },
    []
);
```

## Handling Protected Routes in Next

### redirect on server side rendering

./lib/apollo.tsx

```typescript
try {
    // Run all GraphQL queries
    const { getDataFromTree } = await import("@apollo/react-ssr");
    await getDataFromTree(
        <AppTree
            pagProps={{
                ...pageProps,
                apolloClient
            }}
        />
    );
} catch (error) {
    console.error("Error while running `getDataFromTree`", error);

    // *** handling server side rendering auth routes
    if (error.graphQLErrors[0].message.includes("not authenticated")) {
        /*
        actually we send on server side we throw and Error with not authenticated message then we can redirect user base upon it:
        ./modules/middleware/IsAuth.ts
        if(req.session.userId){
            throw new Error('not authenticated')
        }
        */
        redirect(ctx, "/login");
    }
}
```

### Router.replace in on the client

> yarn add apollo-link-error

./lib/apollo.tsx

```typescript
import { onError } from "apollo-link-error";

const ErrorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) => {
            console.log(
                `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            );
            /*
        actually we send on server side we throw and Error with not authenticated message then we can redirect user base upon it:
        ./modules/middleware/IsAuth.ts
        if(req.session.userId){
            throw new Error('not authenticated')
        }
        */
            if (
                message.includes("not authenticated") &&
                typeof window !== "undefined"
            ) {
                Router.replace("/login"); // *** or Router.push('/login')
            }
        });
    if (networkError) console.log(`[Network error]: ${networkError}`);
});

return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: ErrorLink.concat(authLink.concat(httpLink)), // *** set multipleLink using ApolloLink1.concat(ApolloLink2.concat(httpLink))
    cache: new InMemoryCache().restore(initialState)
});
```

## sundry

## ts-node-dev

Tweaked version of node-dev that uses ts-node under the hood.

> yarn add -D ts-node-dev

```json
{
    "start": "tsnd --respawn  src/index.ts"
}
```

## [ GraphQL SDL review ](https://alligator.io/graphql/graphql-sdl/)

### the basics

```graphql
# Enumeration type
enum Priority {
    LOW
    MEDIUM
    HIGH
}

type Todo {
    id: ID!
    name: String!
    description: String!
    priority: String!
}

type Query {
    todo(id: ID!): Todo
    allTodos: [Todo!]!
}

type Mutation {
    addTodo(name: String!, priority: Priority = LOW): Todo!
    removeTodo(id: ID!): Todo!
}

schema {
    query: Query
    mutation: Mutation
}
```

#### Object Types

-   are defined with the type keyword and start with a capital letter by convention.
-   Each field in an object type can be resolve to either other object types or scalar types.
-   Only the Query root type is required in all GraphQL schemas
-   a Subscription root type is also available, to define operations that a client can subscribe to

#### Built-In Scalar Types

There are 5 built-in scalar types with GraphQL: Int, Float, String, Boolean and ID (The ID type resolves to a string, but expects a unique value).

#### Enumeration Types

Enumeration types allow to define a specific subset of possible values for a type.

#### Type Modifiers

modifiers can be used on the type that a field resolves to by using characters like ! and \[…\]

-   String : nullable string (the resolved value can be null)
-   String! : Non-nullable string (if the resolved value is null, an error will be raised)
-   \[String\] : Nullable list of nullable string values. The entire value can be null, or specific list elements can be null
-   \[String!\] : Nullable list of non-nullable string values. Then entire value can be null, but specific list elements cannot be null
-   \[String!\]! : Non-nullable list of non-nullable string values

#### Comments

Comments are added with the # symbol and only single-line comments are allowed.

#### Custom Scalar Types

It’s also possible to define custom scalar types with a syntax like this:

```graphql
scalar DateTime
```

#### Union Types

Union types define a type that can resolve to a number of possible **object types**:

```graphql
# ...

union Vehicle = Car | Boat | Plane

type Query {
    getVehicle(id: ID!): Vehicle!
}
```

With union types, on the client, inline fragments have to be used to select the desired fields depending on what subtype is being resolved

```graphql
query {
    getVehicle {
        ... on Car {
            yead
        }
        ... on Boat {
            color
        }
        ... on Plane {
            seating
        }
    }
}
```

#### Interfaces

Interfaces are somewhat similar to union types, but they allow multiple object types to share some fields:

```graphql
interface Vehicle {
    color: String
    make: String
    speed: Int
}

type Car implements Vehicle {
    color: String
    make: String
    speed: Int
    model: String
}
```

Each type that implements an interface need to have fields corresponding to all the interface’s fields, but can also have aditional fields of their own.

This way, on the client, inline fragments can be used to get fields that are unique to certain types:

```graphql
graphql {
    getVehicle {
        color
        make
        ...on Car {
            model
        }
    }
}

```

#### Input Types

When a query or mutation expects multiple arguments, it can be easier to define input types where each field represents an argument:

```graphql
#...

input NewTodoInput {
    name: String!
    priority: Priority
}

type Mutation {
    addTodo(newTodoInput: NewTodoInput!): Todo!
}
```

#### Schema Documentation

There’s also a syntax to add human-readable documentation for types and fields, which can become really helpful when using a tool like GraphiQL or GraphQL Playground to browse the documentation for a schema.

```graphql
"""
Priority level
"""
enum Priority {
    LOW
    MEDIUM
    HIGH
}

type Todo {
    id: ID!
    name: String!
    """
    Useful description for todo item
    """
    description: String
    priority: Priority!
}

"""
Queries available on todo app service
"""
type Query {
    """
    Get one todo item
    """
    todo(id: ID!): Todo

    """
    List of all todo items
    """
    allTodos: [Todo!]!
}

type Mutation {
    addTodo(
        "Name for todo item"
        name: String!
        "Priority levl of todo item"
        priority: Priority = LOW
    ): Todo

    removeTodo(id: ID!): Todo!
}

schema {
    query: Query
    mutation: Mutation
}
```
