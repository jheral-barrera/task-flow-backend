import { IsNotEmpty, IsString, Length } from "class-validator";

export class JoinSessionDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  shareCode: string;
}
