import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert
} from "typeorm";
import { hash } from "bcryptjs";
import { ObjectType, Field, ID } from "type-graphql";

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
