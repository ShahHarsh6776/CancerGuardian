import { createContext, useState, useContext, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatbotContextType = {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  toggleChatbot: () => void;
  sendMessage: (message: string) => Promise<void>;
};

const ChatbotContext = createContext<ChatbotContextType | null>(null);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your CancerGuardian assistant. How can I help you today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleChatbot = () => {
    setIsOpen(prev => !prev);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message to chat
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiRequest('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({
          query: content,
          history: messages.map(msg => ({ role: msg.role, content: msg.content }))
        })
      });
      
      const data = await response.json();
      
      // Add AI response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get a response',
        variant: 'destructive'
      });
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again later."
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        messages,
        isLoading,
        toggleChatbot,
        sendMessage
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
