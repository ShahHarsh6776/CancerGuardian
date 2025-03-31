import { useState, useRef, useEffect } from "react";
import { useChatbot } from "@/context/ChatbotContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, Loader2 } from "lucide-react";

export default function Chatbot() {
  const { isOpen, messages, isLoading, toggleChatbot, sendMessage } = useChatbot();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput("");
    await sendMessage(message);
  };
  
  // Render the chatbot trigger button if closed
  if (!isOpen) {
    return (
      <Button
        onClick={toggleChatbot}
        className="fixed bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg p-0"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-10 w-80 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-primary text-white py-3 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <h3 className="font-medium">Health Assistant</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleChatbot} className="h-8 w-8 text-white hover:text-neutral-200 p-0">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="bg-white h-80 p-3 overflow-y-auto" id="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex mb-3 ${message.role === 'user' ? 'justify-end' : ''}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary mr-2">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div 
              className={`${
                message.role === 'user'
                  ? 'bg-primary text-white rounded-lg py-2 px-3 max-w-[85%]'
                  : 'bg-neutral-100 rounded-lg py-2 px-3 max-w-[85%]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex mb-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary mr-2">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-neutral-100 rounded-lg py-2 px-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-white border-t border-neutral-200 p-3">
        <form onSubmit={handleSubmit} className="flex items-center">
          <Input
            type="text"
            placeholder="Type your question..."
            className="flex-grow text-sm border border-neutral-300 rounded-lg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="ml-2 bg-primary hover:bg-primary-dark text-white rounded-full w-8 h-8 flex items-center justify-center p-0"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
