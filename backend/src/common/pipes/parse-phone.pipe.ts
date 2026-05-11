import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

const E164_KE = /^\+254[0-9]{9}$/;

@Injectable()
export class ParsePhonePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== "string" || !E164_KE.test(value.trim())) {
      throw new BadRequestException("phone must be Kenyan E.164 (+254XXXXXXXXX)");
    }
    return value.trim();
  }
}
