import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
//Used for signin Body
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
