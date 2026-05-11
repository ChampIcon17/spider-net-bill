import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type RequestUser = {
  sub: string;
  phone: string;
  role: string;
  jti: string;
};

export const CurrentUser = createParamDecorator((data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
  const user = request.user;
  if (!user) return undefined;
  return data ? user[data] : user;
});
