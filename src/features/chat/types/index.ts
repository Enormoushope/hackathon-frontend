export interface Conversation {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface ItemReaction {
  id: string;
  itemId: string;
  userId: string;
  reactionType: 'like' | 'watch';
  createdAt: string;
}
