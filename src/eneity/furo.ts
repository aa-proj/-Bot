import typeorm, {
    Column,
    Entity, ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import {User} from "./User";

@Entity("Furo")
export class Furo {
    @PrimaryGeneratedColumn("increment")
    id!: number;

    @ManyToOne((type) => User)
    user?: User;

    @Column({type: "datetime", default: null})
    time?: Date;
}
