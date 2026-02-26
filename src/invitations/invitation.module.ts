import { Module } from "@nestjs/common";
import { InvitationController } from "./invitation.controller";
import { InvitationService } from "./invitation.service";
import { InvitationGateway } from "./invitation.gateway";

@Module({
  controllers: [InvitationController],
  providers: [InvitationService, InvitationGateway],
  exports: [InvitationService, InvitationGateway],
})
export class InvitationModule {}
