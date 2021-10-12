import { Client } from '../Client';
import { OptionalOf } from '../Types';
import * as schema from '../TL/Schema';

export class Messages {
  constructor(readonly client: Client) {}

  async deleteMessages(id: number[], revoke?: boolean) {
    return this.client.send(new schema.messages.deleteMessages({ id, revoke }));
  }

  async setTyping(peer: schema.InputPeer, action: schema.SendMessageAction, top_msg_id?: number) {
    return this.client.send(new schema.messages.setTyping({ action, peer, top_msg_id }));
  }

  async sendMessage(
    peer: schema.InputPeer,
    message: string,
    random_id: bigint,
    options?: OptionalOf<schema.messages.sendMessageParam>
  ): Promise<schema.updateShortSentMessage | schema.updates> {
    return this.client.send(
      new schema.messages.sendMessage({ message, peer, random_id, ...options })
    );
  }

  async sendMedia(
    peer: schema.InputPeer,
    media: schema.InputMedia,
    message: string,
    random_id: bigint,
    options?: OptionalOf<schema.messages.sendMediaParam>
  ): Promise<schema.updates> {
    return this.client.send(
      new schema.messages.sendMedia({ media, message, peer, random_id, ...options })
    );
  }

  async forwardMessages(
    from_peer: schema.InputPeer,
    to_peer: schema.InputPeer,
    id: number[],
    random_id: bigint[],
    options?: OptionalOf<schema.messages.forwardMessagesParam>
  ) {
    return this.client.send(
      new schema.messages.forwardMessages({ from_peer, id, random_id, to_peer, ...options })
    );
  }

  async editMessages(
    peer: schema.InputPeer,
    id: number,
    options?: OptionalOf<schema.messages.editMessageParam>
  ) {
    return this.client.send(new schema.messages.editMessage({ id, peer, ...options }));
  }
}
