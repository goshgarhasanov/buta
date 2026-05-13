import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9_.]+$/i, {
    message: 'İstifadəçi adı yalnız hərflər, rəqəmlər, _ və . simvollarından ibarət ola bilər',
  })
  username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Telefon nömrəsi E.164 formatında olmalıdır' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Parol minimum 8 simvol olmalıdır' })
  password!: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  displayName?: string;
}

export class LoginDto {
  @IsString()
  identifier!: string; // username / email / phone

  @IsString()
  password!: string;
}
