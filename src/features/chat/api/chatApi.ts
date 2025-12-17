import { apiClient } from '@/lib/axios';
import type { Conversation, Message } from '../types';

export const createConversation = async (
  itemId: string,
  buyerId: string,
  sellerId: string
): Promise<Conversation | null> => {
  try {
    const response = await apiClient.post<Conversation>('/conversations', {
      itemId,
      buyerId,
      sellerId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return null;
  }
};

export const getConversation = async (
  conversationId: string
): Promise<Conversation | null> => {
  try {
    const response = await apiClient.get<Conversation>(
      `/conversations/${conversationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return null;
  }
};

export const getConversationsByUser = async (
  userId: string
): Promise<Conversation[]> => {
  try {
    const response = await apiClient.get<Conversation[]>('/conversations', {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return [];
  }
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message | null> => {
  try {
    const response = await apiClient.post<Message>('/messages', {
      conversationId,
      senderId,
      content,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    return null;
  }
};

export const getMessages = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    const response = await apiClient.get<Message[]>(
      `/conversations/${conversationId}/messages`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get messages:', error);
    return [];
  }
};
