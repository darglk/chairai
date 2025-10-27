/**
 * ChatWidget Component
 *
 * GetStream Chat integration for real-time communication between client and artisan.
 * Uses custom UI with GetStream backend for better ESM compatibility.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2, Send } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { StreamChat, type Channel as StreamChannel, type MessageResponse } from "stream-chat";

interface ChatWidgetProps {
  projectId: string;
  artisanId: string;
  currentUserId: string;
}

/**
 * Chat widget with GetStream integration
 */
export function ChatWidget({ projectId, artisanId, currentUserId }: ChatWidgetProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat connection
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Remove duplicates from members list (in case currentUserId === artisanId)
        const uniqueMembers = Array.from(new Set([currentUserId, artisanId]));

        // Ensure all users exist in GetStream before creating channel
        const usersResponse = await fetch("/api/chat/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: uniqueMembers }),
        });

        if (!usersResponse.ok) {
          throw new Error("Nie udało się utworzyć użytkowników w systemie czatu");
        }

        // Fetch GetStream token from API
        const response = await fetch("/api/chat/token");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać tokenu czatu");
        }

        const { token, userId, apiKey } = await response.json();

        // Initialize GetStream client
        const chatClient = StreamChat.getInstance(apiKey);

        // Connect user
        await chatClient.connectUser(
          {
            id: userId,
          },
          token
        );

        // Create or get channel for this project
        const channelId = `project-${projectId}`;
        const chatChannel = chatClient.channel("messaging", channelId, {
          members: uniqueMembers,
        });

        await chatChannel.watch();

        setClient(chatClient);
        setChannel(chatChannel);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas inicjalizacji czatu";
        setError(errorMessage);
        // eslint-disable-next-line no-console
        console.error("[ChatWidget] Error initializing chat:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    // Cleanup on unmount
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [projectId, artisanId, currentUserId]);

  // Load messages and subscribe to new ones
  useEffect(() => {
    if (!channel) return;

    // Load existing messages
    channel.query({ messages: { limit: 50 } }).then((state) => {
      setMessages(state.messages as MessageResponse[]);
    });

    // Subscribe to new messages
    const handleNewMessage = (event: { message?: MessageResponse }) => {
      if (event.message) {
        setMessages((prev) => [...prev, event.message as MessageResponse]);
      }
    };

    channel.on("message.new", handleNewMessage);

    return () => {
      channel.off("message.new", handleNewMessage);
    };
  }, [channel]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-lg">Czat z rzemieślnikiem</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Ładowanie czatu...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !client || !channel) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-lg">Czat z rzemieślnikiem</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-sm text-destructive">{error || "Nie udało się załadować czatu"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !channel || isSending) return;

    setIsSending(true);
    try {
      await channel.sendMessage({ text: newMessage });
      setNewMessage("");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[ChatWidget] Error sending message:", error);
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
          <CardTitle className="text-lg">Czat z rzemieślnikiem</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages Container */}
          <div className="h-[400px] overflow-y-auto border rounded-lg p-4 bg-muted/30">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Brak wiadomości. Rozpocznij rozmowę.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwnMessage = msg.user?.id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-background border"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at || "").toLocaleTimeString("pl-PL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Napisz wiadomość... (Enter aby wysłać)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending}
              rows={2}
              className="resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="h-full"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Wyślij</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
