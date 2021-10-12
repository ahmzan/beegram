/* 
beegram - Telegram MTProto API Client Framework
Copyright (C) 2021 Ahmzan <https://github.com/ahmzan>

This file is part of beegram.

beegram is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

beegram is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with beegram.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Client } from './Client';
import { OptionalOf, OptionalPropertyOf, UpdateEvent, UpdateEventMap } from './Types';
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';
import * as schema from './TL/Schema';

export class Context<U extends UpdateEvent> {
  replyId: number = 0;
  constructor(readonly client: Client, readonly update: U) {
    this.client = client;
    this.update = update;
  }

  // get from() {
  //   if (this.update._ == 'updateNewMessage') {
  //     if (this.update.message._ == 'message') {
  //       // return this.client.resolvePeer(
  //       //   this.update.message.peer_id._ == 'peerUser'
  //       //     ? this.update.message.peer_id.user_id
  //       //     : this.update.message.peer_id._ == 'peerChat'
  //       //     ? this.update.message.peer_id.chat_id
  //       //     : this.update.message.peer_id.channel_id
  //       // );
  //     }
  //   }
  //   if (this.update._ == 'updateShortMessage') {
  //     this.update.user_id;
  //   }
  // }
  get outgoing(): boolean {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateNewChannelMessage
    )
      return this.update.message._ == 'message'
        ? this.update.message.out == true
          ? true
          : false
        : false;
    if (this.update instanceof schema.updateShortMessage)
      return this.update.out == true ? true : false;
    return false;
  }

  get incoming() {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateNewChannelMessage
    )
      return this.update.message._ == 'message'
        ? this.update.message.out == false
          ? true
          : false
        : false;
    if (this.update instanceof schema.updateShortMessage)
      return this.update.out == false ? true : false;
    return false;
  }

  get message() {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateNewChannelMessage
    )
      return this.update.message._ == 'message' ? this.update.message.message : '';
    if (this.update instanceof schema.updateShortMessage) return this.update.message;
    return '';
  }

  get editedMessage() {
    if (
      this.update instanceof schema.updateEditMessage ||
      this.update instanceof schema.updateEditChannelMessage
    )
      return this.update.message._ == 'message' ? this.update.message.message : '';
    return '';
  }

  get peerId() {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateNewChannelMessage
    )
      return this.update.message._ != 'messageEmpty'
        ? this.update.message.peer_id._ == 'peerUser'
          ? this.update.message.peer_id.user_id
          : this.update.message.peer_id._ == 'peerChat'
          ? this.update.message.peer_id.chat_id
          : this.update.message.peer_id.channel_id
        : 0;
    if (this.update instanceof schema.updateShortMessage) return this.update.user_id;
    return 0;
  }

  get fromId() {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateNewChannelMessage
    )
      return this.update.message._ != 'messageEmpty'
        ? this.update.message.from_id != undefined
          ? this.update.message.from_id._ == 'peerUser'
            ? this.update.message.from_id.user_id
            : this.update.message.from_id._ == 'peerChat'
            ? this.update.message.from_id.chat_id
            : this.update.message.from_id.channel_id
          : 0
        : 0;

    if (this.update instanceof schema.updateShortMessage) return this.update.user_id;
    return 0;
  }

  get date() {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateNewChannelMessage
    )
      return this.update.message._ == 'message' ? this.update.message.date : 0;
    if (this.update instanceof schema.updateShortMessage) return this.update.date;
    return 0;
  }

  get inputPeer() {
    return this.client.resolvePeer(this.peerId);
  }

  get msgId() {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateNewChannelMessage
    )
      return this.update.message._ == 'message' ? this.update.message.id : 0;
    if (this.update instanceof schema.updateShortMessage) return this.update.id;
    return 0;
  }

  get type(): 'user' | 'group' | 'supergroup' | 'channel' {
    if (
      this.update instanceof schema.updateNewMessage ||
      this.update instanceof schema.updateEditMessage ||
      this.update instanceof schema.updateNewChannelMessage ||
      this.update instanceof schema.updateEditChannelMessage
    )
      return this.update.message._ != 'messageEmpty'
        ? this.update.message.peer_id._ == 'peerUser'
          ? 'user'
          : this.update.message.peer_id._ == 'peerChat'
          ? 'group'
          : 'channel'
        : 'supergroup';
    if (this.update instanceof schema.updateShortMessage) return 'user';
    return 'group';
  }

  async reply(message: string, options?: OptionalOf<schema.messages.sendMessageParam>) {
    const res = await this.client.messages.sendMessage(
      await this.client.resolvePeer(this.peerId),
      message,
      this.client.randomId(),
      options
    );

    if (res instanceof schema.updateShortSentMessage) {
      this.replyId = res.id;
      // this.replyPeer =
    }

    if (res instanceof schema.updates) {
      for (const update of res.updates) {
        if (update instanceof schema.updateNewMessage) {
          this.replyId = update.message._ != 'messageEmpty' ? update.message.id : 0;
        }
      }
    }
    return res;
  }

  async replyWithMedia(
    media: schema.InputMedia,
    message: string,
    options?: OptionalOf<schema.messages.sendMediaParam>
  ) {
    return this.client.messages.sendMedia(
      await this.client.resolvePeer(this.peerId),
      media,
      message,
      this.client.randomId(),
      options
    );
  }

  async replyWithPhoto(
    photo: File | string,
    message: string,
    options?: OptionalOf<schema.messages.sendMediaParam> &
      OptionalOf<schema.inputMediaUploadedPhotoParam>
  ) {
    let inputMedia: schema.InputMedia;
    if (typeof photo == 'string') {
      if (photo.startsWith('http')) {
        inputMedia = new schema.inputMediaPhotoExternal({
          url: photo,
          ttl_seconds: options?.ttl_seconds
        });
      } else {
        const bufPhoto = readFileSync(resolve(photo));
        const filename = basename(photo);
        const inputFile = await this.client.uploadFile(bufPhoto, filename);

        inputMedia = new schema.inputMediaUploadedPhoto({
          file: inputFile,
          ...options
        });
      }
    } else {
      const filename = basename(photo.filename ?? 'file.jpg');
      const inputFile = await this.client.uploadFile(photo.file, filename);

      inputMedia = new schema.inputMediaUploadedPhoto({
        file: inputFile,
        ...options
      });
    }

    return this.replyWithMedia(inputMedia, message, options);
  }

  async replyWithDoc(
    doc: File | string,
    message: string,
    options?: OptionalOf<schema.messages.sendMediaParam> &
      OptionalOf<schema.inputMediaUploadedDocumentParam>
  ) {
    let inputMedia: schema.InputMedia;
    if (typeof doc == 'string') {
      if (doc.startsWith('http')) {
        inputMedia = new schema.inputMediaDocumentExternal({
          url: doc,
          ttl_seconds: options?.ttl_seconds
        });
      } else {
        const bufPhoto = readFileSync(resolve(doc));
        const filename = basename(doc);
        const inputFile = await this.client.uploadFile(bufPhoto, filename);

        inputMedia = new schema.inputMediaUploadedDocument({
          attributes: [new schema.documentAttributeFilename({ file_name: filename })],
          file: inputFile,
          mime_type: this.client.getMimeType(filename),
          ...options
        });
      }
    } else {
      const filename = basename(doc.filename ?? 'file.jpg');
      const inputFile = await this.client.uploadFile(doc.file, filename);

      inputMedia = new schema.inputMediaUploadedDocument({
        attributes: [new schema.documentAttributeFilename({ file_name: filename })],
        file: inputFile,
        mime_type: this.client.getMimeType(filename),
        ...options
      });
    }

    return this.replyWithMedia(inputMedia, message, options);
  }

  async editReply(message: string) {
    return this.client.messages.editMessages(
      await this.client.resolvePeer(this.peerId),
      this.replyId,
      {
        message
      }
    );
  }

  async forwardTo(
    peer: schema.InputPeer,
    options?: OptionalOf<schema.messages.forwardMessagesParam>
  ) {
    return this.client.messages.forwardMessages(
      await this.client.resolvePeer(this.peerId),
      peer,
      [this.msgId],
      [this.client.randomId()],
      options
    );
  }
}

interface File {
  file: Buffer;
  filename?: string;
}

// interface MessageOptions {
//   background?: boolean;
//   clear_draft?: boolean;
//   entities?: schema.MessageEntity[];
//   no_webpage?: boolean;
//   reply_markup?: schema.ReplyMarkup;
//   reply_to_msg_id?: number;
//   schedule_date?: number;
//   silent?: boolean;
// }
