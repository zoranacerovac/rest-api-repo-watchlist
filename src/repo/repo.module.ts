import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repo } from './repo.entity';
import { RepoController } from './repo.controller';
import { RepoService } from './repo.service';
import { ConfigModule } from '@nestjs/config';
import { Watchlist } from 'src/user/entites/watchlist.entity';
//import { MailerModule, MailerService } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repo, Watchlist]),
    ConfigModule.forRoot(),
  ],
  controllers: [RepoController],
  providers: [RepoService],
})
export class RepoModule {}
