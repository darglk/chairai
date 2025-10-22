/**
 * ChatWidget Component
 *
 * Simplified chat interface for communication between client and artisan.
 * Currently displays a placeholder - full chat functionality to be implemented later.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface ChatWidgetProps {
  projectId?: string;
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
}

/**
 * Chat widget for project communication
 * TODO: Implement real-time chat functionality with API integration
 */
export function ChatWidget({ messages = [], onSendMessage }: ChatWidgetProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);

    try {
      // TODO: Implement API call to send message
      if (onSendMessage) {
        onSendMessage(newMessage);
      }
      setNewMessage("");
    } catch {
      alert("Nie udało się wysłać wiadomości");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle className="text-lg">Komunikacja z rzemieślnikiem</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Container */}
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto border rounded-lg p-4 bg-muted/30">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Brak wiadomości. Rozpocznij rozmowę z rzemieślnikiem.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-background rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Napisz wiadomość... (naciśnij Enter aby wysłać)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            rows={3}
            className="resize-none"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending} size="icon" className="h-full">
            <Send className="h-4 w-4" />
            <span className="sr-only">Wyślij wiadomość</span>
          </Button>
        </div>

        {/* Info Note */}
        <p className="text-xs text-muted-foreground">
          💡 Użyj tego czatu do komunikacji z rzemieślnikiem podczas realizacji projektu.
        </p>
      </CardContent>
    </Card>
  );
}
