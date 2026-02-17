import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    //verificar email si existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    //encriptar/hashear contrasena
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    //crear usuario
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    //retornar usuario
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    //buscamos usuario por email
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //comparar contrasena
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //generamos token de JWT
    const payload = { sub: user.id, email: user.email };
    return {
      acces_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUser(userId: string) {
    //validar usuario por id
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    //retornar usuario
    const { ...result } = user;
    return result;
  }
}
