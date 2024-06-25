import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Repo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({})
  repositoryName: string;

  @Column({})
  authorName: string;

  @Column({})
  repositoryUrls: string;

  @Column({})
  releasesUrl: string;

  @Column({})
  subscriptionUrl: string;
}
