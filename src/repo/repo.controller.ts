import {
  Controller,
  Get,
  Query,
  BadRequestException,
  HttpException,
  Body,
  Post,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RepoService } from './repo.service';
import { RepoDto } from './dto/repo.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('repos')
export class RepoController {
  constructor(private readonly repoService: RepoService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('search')
  async search(@Query('q') query: string) {
    try {
      return await this.repoService.searchRepositories(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new BadRequestException(error.message);
      }
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-watchlist')
  async getMyWatchlist(@Req() req: Request) {
    const user = req.user as { id: number; username: string; email: string };
    return this.repoService.getMyWatchlist(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('add')
  async addSubscription(@Body() dto: RepoDto, @Req() req: Request) {
    const user = req.user as { id: number; username: string; email: string };
    return this.repoService.addSubscription(dto, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('remove')
  async removeSubscription(@Body() dto: RepoDto, @Req() req: Request) {
    const user = req.user as { id: number; username: string; email: string };
    return this.repoService.removeSubscription(dto, user.id);
  }

  //GIT HUB WATCH...
  @Post('subscribe')
  async subscribeToRepo(
    @Body('owner') owner: string,
    @Body('repo') repo: string,
  ) {
    try {
      return await this.repoService.subscribeToRepo(owner, repo);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
    }
  }

  @Post('unsubscribe')
  async unsubscribeFromRepo(
    @Body('owner') owner: string,
    @Body('repo') repo: string,
  ) {
    try {
      return await this.repoService.unsubscribeFromRepo(owner, repo);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
    }
  }
}
