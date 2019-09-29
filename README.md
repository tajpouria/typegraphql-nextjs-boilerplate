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

    const schema = await buildSchema({ resolvers: [HelloResolver] });

    const apolloServer = new ApolloServer({ schema });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("Listening on port 4000...");
    });
})();
```

### write mutation

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
