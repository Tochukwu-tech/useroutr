import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway()
export class EventsGateway {
  @SubscribeMessage('message')
  handleMessage(): string {
    return 'Hello world!';
  }
}
