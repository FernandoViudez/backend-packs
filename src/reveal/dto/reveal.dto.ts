import { IsDefined, IsNumber, IsString } from 'class-validator';

export class RevealDto {
  @IsNumber()
  @IsDefined()
  readonly assetId: number;
  @IsString()
  @IsDefined()
  readonly logicSig: string;
}
