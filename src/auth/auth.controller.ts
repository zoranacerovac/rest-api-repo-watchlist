import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/user/entites/user.entity';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('singup')
  signup(@Body() dto: User) {
    return this.authService.signup(dto);
  }

  @Post('singin')
  signin(@Body() dto: LoginDto) {
    return this.authService.signin(dto);
  }
}
