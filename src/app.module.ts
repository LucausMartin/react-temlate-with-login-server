import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_CONFIG } from './constants';
@Module({
  imports: [UsersModule, TypeOrmModule.forRoot(DB_CONFIG)],
  controllers: [],
  providers: [],
})
export class AppModule {}
