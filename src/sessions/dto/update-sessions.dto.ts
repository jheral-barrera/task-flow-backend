import { IsOptional, IsString } from "class-validator";

export class UpdateSessionsDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
