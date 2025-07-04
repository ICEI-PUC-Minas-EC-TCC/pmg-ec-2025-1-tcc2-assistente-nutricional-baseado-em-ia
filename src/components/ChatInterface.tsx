
"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { Bot, Send, User as UserIcon, Zap, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { nutritionChat } from "@/ai/flows/nutrition-chat-flow";
import type { NutritionChatInput } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingEnabled, setIsStreamingEnabled] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentAiMessageIdRef = useRef<string | null>(null);

  const { currentUser, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login?redirect=/chat");
    }
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!profile?.apiKey) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        sender: "ai",
        text: "Erro: Google API Key não configurada. Por favor, adicione sua chave na página de Perfil.",
        timestamp: new Date(),
      }]);
      return;
    }

    const userMessageText = inputValue;
    setInputValue("");

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userMessageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    currentAiMessageIdRef.current = aiMessageId;

    const placeholderAiMessage: ChatMessage = {
      id: aiMessageId,
      sender: "ai",
      text: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, placeholderAiMessage]);

    try {
      const chatInput: NutritionChatInput = {
        userMessage: userMessageText,
        apiKey: profile.apiKey, // Pass API Key
        ...(profile && { userProfile: {
            name: profile.name,
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            dietaryRestrictions: profile.dietaryRestrictions,
            activityLevel: profile.activityLevel,
            // apiKey is not part of userProfile object for the flow, it's a top-level prop in NutritionChatInput
        } }),
      };

      const stream = nutritionChat(chatInput);
      let accumulatedResponse = "";

      if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
        console.error("Client: Received object from server action is not async iterable.", stream);
        if (stream instanceof Promise) {
          stream.then(resolvedValue => {
            console.log("Client: The Promise from server action resolved to:", resolvedValue);
             setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === aiMessageId ? { ...msg, text: `Erro: Falha no streaming. Resposta recebida: ${JSON.stringify(resolvedValue)}` } : msg
              )
            );
          }).catch(error => {
            console.error("Client: The Promise from server action rejected with:", error);
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === aiMessageId ? { ...msg, text: `Erro: Falha no streaming. Erro: ${error.message || JSON.stringify(error)}` } : msg
              )
            );
          });
        } else {
           setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: "Erro: Falha ao iniciar o streaming com a IA. O objeto recebido não é iterável." } : msg
            )
          );
        }
        setIsLoading(false);
        currentAiMessageIdRef.current = null;
        return;
      }
      
      for await (const chunk of stream) {
        if (typeof chunk !== 'string') {
          console.warn("Client: Received non-string chunk from stream", chunk);
          continue;
        }
        if (isStreamingEnabled) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
            )
          );
        } else {
          accumulatedResponse += chunk;
        }
      }

      if (!isStreamingEnabled && accumulatedResponse) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: accumulatedResponse } : msg
          )
        );
      } else if (!isStreamingEnabled && !accumulatedResponse && messages.find(msg => msg.id === aiMessageId && msg.text === "")) {
         if (!accumulatedResponse.startsWith("Error:")) {
             setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                msg.id === aiMessageId ? { ...msg, text: "Nenhuma resposta recebida da IA." } : msg
                )
            );
        }
      }
    } catch (error) {
      console.error("Erro ao obter resposta da IA (client-side catch):", error);
      const errorMessageText = error instanceof Error ? error.message : "Desculpe, ocorreu um erro no cliente ao processar a resposta da IA.";
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiMessageId ? { ...msg, text: errorMessageText } : msg
        )
      );
    } finally {
      setIsLoading(false);
      currentAiMessageIdRef.current = null;
    }
  };

  if (authLoading || profileLoading) {
    return <div className="flex justify-center items-center h-[70vh]"><LoadingSpinner text="Carregando chat..." /></div>;
  }

  if (!currentUser) {
     return <div className="flex justify-center items-center h-[70vh]"><LoadingSpinner text="Redirecionando para login..." /></div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl flex flex-col h-[calc(100vh-10rem)] min-h-[500px]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-headline text-2xl">Assistente de Chat Nutricional</CardTitle>
            <CardDescription>
              Faça perguntas sobre nutrição, receitas ou itens alimentares. Requer Google API Key.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="realtime-switch"
              checked={isStreamingEnabled}
              onCheckedChange={setIsStreamingEnabled}
              disabled={isLoading}
            />
            <Label htmlFor="realtime-switch" className="text-sm flex items-center gap-1">
              <Zap size={14} className={cn(isStreamingEnabled ? "text-primary" : "text-muted-foreground")} />
              Realtime
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {(!profileLoading && !profile?.apiKey) && (
              <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300 mb-4">
                <AlertCircle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
                <AlertTitle>Google API Key Necessária</AlertTitle>
                <AlertDescription>
                  Para usar o chat, por favor, adicione sua Google API Key em seu <Button variant="link" asChild className="p-0 h-auto"><Link href="/profile">Perfil</Link></Button>.
                </AlertDescription>
              </Alert>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2",
                  message.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === "ai" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2 text-sm shadow break-words whitespace-pre-wrap",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none"
                  )}
                >
                  {message.text}
                  {(isLoading && message.id === currentAiMessageIdRef.current && message.text === "") && <LoadingSpinner size="sm" className="p-2"/>}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {message.sender === "user" && (
                  <Avatar className="h-8 w-8">
                     <AvatarFallback className="bg-accent text-accent-foreground">
                      <UserIcon size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {(isLoading && messages.length > 0 && messages[messages.length -1]?.sender === 'user' && !messages.find(m => m.id === currentAiMessageIdRef.current)) && (
              <div className="flex justify-start items-end gap-2">
                 <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 shadow rounded-bl-none">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
            disabled={isLoading || (!profileLoading && !profile?.apiKey)}
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim() || (!profileLoading && !profile?.apiKey)}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
