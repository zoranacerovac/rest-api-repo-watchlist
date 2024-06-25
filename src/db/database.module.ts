import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3308,
      username: 'root',
      password: '',
      database: 'github_watchlist',
      autoLoadEntities: true,
      synchronize: false, // Use this only in development, as it auto-creates database schema
    }),
  ],
})
export class DatabaseModule {}
