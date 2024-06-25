import { IsNotEmpty } from 'class-validator';
import { Entity } from 'typeorm';

@Entity()
export class RepoDto {
  @IsNotEmpty()
  repositoryName: string;

  @IsNotEmpty()
  authorName: string;

  @IsNotEmpty()
  repositoryUrls: string;

  @IsNotEmpty()
  releasesUrl: string;

  @IsNotEmpty()
  subscriptionUrl: string;
}
