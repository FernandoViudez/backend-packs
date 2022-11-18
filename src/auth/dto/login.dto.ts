import { IsDefined, IsString } from "class-validator";

export class LoginDto {
    @IsDefined()
    @IsString()
    readonly signedTxn: string;
}