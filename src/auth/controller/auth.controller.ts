import { Controller, Body } from '@nestjs/common';
import { Post, } from '@nestjs/common/decorators';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../service/auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ){ }
    @Post()
    async login(@Body() body: LoginDto) {
        return await this.authService.login(body);
    }
}
