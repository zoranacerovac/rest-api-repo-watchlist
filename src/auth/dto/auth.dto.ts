import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
//Used for signup Body
export class AuthDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
