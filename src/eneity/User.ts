import typeorm, {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import {Furo} from "./furo";

@Entity("User")
export class User {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({type: "text", default: null})
  discordId?: string;

  @OneToMany((type) => Furo, (sleep) => sleep.user)
  furos?: Furo[];
}
