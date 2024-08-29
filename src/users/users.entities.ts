import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class Users {
  @PrimaryColumn()
  email: string;

  @Column({ name: 'name', default: 'empty' })
  name: string;
}
