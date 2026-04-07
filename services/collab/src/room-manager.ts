/**
 * Room Manager — one Yjs room per draft id.
 *
 * Each room owns:
 *   - a single shared Y.Doc
 *   - an Awareness instance for cursors and presence
 *   - a set of connected WebSocket clients
 *
 * Wire protocol is the standard y-websocket sync + awareness protocol so any
 * y-websocket compatible client (incl. our `CollabDraft` class) can connect.
 */

import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import type { ServerWebSocket } from "bun";
import { DraftPersistence } from "./persistence.js";

// y-websocket message tags
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

export interface ClientContext {
  /** Authenticated subject (user id). */
  userId: string;
  /** Account scoping the draft. */
  accountId: string;
  /** Draft / room id. */
  draftId: string;
  /** Per-connection awareness client id (set after first awareness msg). */
  awarenessClientId?: number;
}

export interface Room {
  draftId: string;
  accountId: string;
  doc: Y.Doc;
  awareness: Awareness;
  clients: Set<ServerWebSocket<ClientContext>>;
  version: { value: number };
}

export class RoomManager {
  private readonly rooms = new Map<string, Room>();
  private readonly persistence: DraftPersistence;

  constructor(persistence: DraftPersistence) {
    this.persistence = persistence;
  }

  /** Get-or-create a room and load persisted state on first creation. */
  async getOrCreateRoom(draftId: string, accountId: string): Promise<Room> {
    const existing = this.rooms.get(draftId);
    if (existing) return existing;

    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    const version = { value: 0 };
    version.value = await this.persistence.load(draftId, doc);

    const room: Room = {
      draftId,
      accountId,
      doc,
      awareness,
      clients: new Set(),
      version,
    };

    // Persist on every doc update (debounced).
    doc.on("update", (_update: Uint8Array, origin: unknown) => {
      // Don't re-persist updates that came from our own load.
      if (origin === "load") return;
      this.persistence.schedule(draftId, accountId, doc, version);
    });

    // Broadcast awareness changes to all peers.
    awareness.on(
      "update",
      (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        const changedClients = added.concat(updated, removed);
        if (changedClients.length === 0) return;
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          encodeAwarenessUpdate(awareness, changedClients),
        );
        const payload = encoding.toUint8Array(encoder);
        for (const client of room.clients) {
          if (client !== origin && client.readyState === 1) {
            client.send(payload);
          }
        }
      },
    );

    this.rooms.set(draftId, room);
    return room;
  }

  /** Send the initial sync step + awareness state to a freshly connected client. */
  sendSyncStep1(room: Room, ws: ServerWebSocket<ClientContext>): void {
    // sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    ws.send(encoding.toUint8Array(encoder));

    // initial awareness state
    const states = room.awareness.getStates();
    if (states.size > 0) {
      const aEncoder = encoding.createEncoder();
      encoding.writeVarUint(aEncoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        aEncoder,
        encodeAwarenessUpdate(room.awareness, Array.from(states.keys())),
      );
      ws.send(encoding.toUint8Array(aEncoder));
    }
  }

  /** Process an inbound binary message from a client. */
  handleMessage(
    room: Room,
    ws: ServerWebSocket<ClientContext>,
    message: Uint8Array,
  ): void {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MESSAGE_SYNC: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, room.doc, ws);
        if (encoding.length(encoder) > 1) {
          ws.send(encoding.toUint8Array(encoder));
        }
        break;
      }
      case MESSAGE_AWARENESS: {
        applyAwarenessUpdate(
          room.awareness,
          decoding.readVarUint8Array(decoder),
          ws,
        );
        break;
      }
      default:
        console.warn(`[collab:room] unknown message type ${messageType}`);
    }
  }

  addClient(room: Room, ws: ServerWebSocket<ClientContext>): void {
    room.clients.add(ws);
  }

  async removeClient(
    room: Room,
    ws: ServerWebSocket<ClientContext>,
  ): Promise<void> {
    room.clients.delete(ws);

    // Drop this client's awareness entry so peers see them disappear.
    if (ws.data.awarenessClientId !== undefined) {
      removeAwarenessStates(
        room.awareness,
        [ws.data.awarenessClientId],
        "disconnect",
      );
    }

    // If the room is now empty, flush state and tear it down.
    if (room.clients.size === 0) {
      try {
        await this.persistence.flush(
          room.draftId,
          room.accountId,
          room.doc,
          room.version,
        );
      } catch (err) {
        console.error(`[collab:room] final flush failed for ${room.draftId}:`, err);
      }
      room.awareness.destroy();
      room.doc.destroy();
      this.rooms.delete(room.draftId);
    }
  }

  /** Force-close a room (admin / DELETE endpoint). */
  async closeRoom(draftId: string): Promise<boolean> {
    const room = this.rooms.get(draftId);
    if (!room) return false;
    for (const client of room.clients) {
      try {
        client.close(1000, "room closed");
      } catch {
        // ignore
      }
    }
    await this.persistence.flush(
      room.draftId,
      room.accountId,
      room.doc,
      room.version,
    );
    room.awareness.destroy();
    room.doc.destroy();
    this.rooms.delete(draftId);
    return true;
  }

  getRoom(draftId: string): Room | undefined {
    return this.rooms.get(draftId);
  }

  stats(): { rooms: number; clients: number } {
    let clients = 0;
    for (const room of this.rooms.values()) clients += room.clients.size;
    return { rooms: this.rooms.size, clients };
  }
}
