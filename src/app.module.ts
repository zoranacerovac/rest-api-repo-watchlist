import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './db/database.module';
import { RepoModule } from './repo/repo.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthModule,
    UserModule,
    DatabaseModule,
    RepoModule,
    ConfigModule.forRoot({}),
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
