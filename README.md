# Type GraphQL Series

A quick introduction to type-graphql library : [https://typegraphql.ml/]

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

## Sundry

### ts-node-dev

Tweaked version of node-dev that uses ts-node under the hood.

> yarn add -D ts-node-dev

```json
{
    "start": "tsnd --respawn  src/index.ts"
}
```
