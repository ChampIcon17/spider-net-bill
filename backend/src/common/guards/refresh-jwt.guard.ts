import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { isObservable } from "rxjs";
import { lastValueFrom } from "rxjs";

@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard("jwt-refresh") {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = super.canActivate(context);
    return isObservable(can) ? lastValueFrom(can) : Promise.resolve(can as boolean);
  }
}
