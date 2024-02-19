import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import now from "../utils/timenow";
import { useConfigData } from "./ConfigData";
import { Message } from "@lib/types";
import { getId } from "@lib/utils/utils";
import io from 'socket.io-client';
import { useSessionId } from "@lib/hooks/useSessionId";
import { BotResponse, UserMessage } from "@lib/types/messageTypes";
import { createSafeContext } from "./create-safe-context";

export type FailedMessage = {
  message: Message;
  reason?: string;
};

interface ChatContextData {
  messages: Message[];
  conversationInfo: string | null;
  sendMessage: (message: Extract<Message, { from: 'user' }>) => void;
  loading: boolean;
  failedMessage: FailedMessage | null;
  reset: () => void;
  setLastMessageId: (id: number | null) => void;
  lastMessageToVote: number | null;
}
const [
  useChat,
  ChatSafeProvider,
] = createSafeContext<ChatContextData>();

const useIdle = (idleTimeout: number): boolean => {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleActivity = () => {
      clearTimeout(timeout);
      setIsIdle(false);
      timeout = setTimeout(() => setIsIdle(true), idleTimeout);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [idleTimeout]);

  return isIdle;
};

const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentMessagePair, setCurrentMessagePair] = useState<{ user: string; bot: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const config = useConfigData();
  const { sessionId } = useSessionId(config.token);
  const [conversationInfo, setConversationInfo] = useState<string | null>(null);
  const [lastMessageToVote, setLastMessageToVote] = useState<number | null>(null);
  const setLastMessageId = useCallback((id: number | null) => {
    setLastMessageToVote(id)
  }, [])
  
  const isIdle = useIdle(5 * 60 * 1000);
  const socket = useMemo(() => {
    if (isIdle) return null;
    return io(config.socketUrl, {
      extraHeaders: {
        "X-Bot-Token": config.token,
        "X-Session-Id": sessionId,
      },
    });
  }, [config, sessionId, isIdle]);

  const [failedMessage, setError] = useState<FailedMessage | null>(null);
  const loading = currentMessagePair !== null;

  const sendMessage = async (message: Extract<Message, { from: "user" }>) => {
    // abort 
    const userMessageId = getId();
    const botMessageId = getId();
    const userMessage: UserMessage & { session_id: string, headers: Record<string, string> } = {
      timestamp: now(),
      id: userMessageId,
      content: message.content,
      from: "user",
      session_id: sessionId,
      headers: config.headers ?? {},
    }
    socket?.emit('send_chat', userMessage);

    setCurrentMessagePair({
      user: userMessageId,
      bot: botMessageId,
    })

    createUserMessage(userMessage);
    createEmptyBotMessage(botMessageId)
  };

  const createUserMessage = useCallback((message: Extract<Message, { from: "user" }>) => {
    setMessages((m) => [...m, message]);
  }, [setMessages]);

  const createEmptyBotMessage = useCallback((id: string) => {
    setMessages((m) => [...m, {
      timestamp: now(),
      from: "bot",
      id: id,
      type: "text",
      response: {
        text: ""
      }
    }])
  }, [setMessages]);

  const updateBotMessage = useCallback((id: string, text: string) => {
    const botMessage = messages.find(m => m.id === id) as BotResponse
    if (botMessage) {
      // append the text to the bot message
      const textt = botMessage.response.text + text
      botMessage.response.text = textt
      setMessages([...messages])
    }
  }, [messages])

  useEffect(() => {
    socket?.on(`${sessionId}_info`, (msg: string) => {
      setConversationInfo(msg)
    })

    return () => {
      socket?.off(`${sessionId}_info`);
    };
  }, [sessionId, socket]);

  useEffect(() => {
    const current = currentMessagePair
    // the content is the message.content from the server
    try {
      socket?.on(sessionId, (content: string) => {
        if (current) {
          if (content === "|im_end|") {
            setCurrentMessagePair(null)
            return
          }
          setConversationInfo(null)
          updateBotMessage(current.bot, content)
        }
      });
      return () => { socket?.off(sessionId) }
    } catch (error) {
      setConversationInfo(null)
    }

  }, [currentMessagePair, sessionId, socket, updateBotMessage]);
  useEffect(() => {
    socket?.on(`${sessionId}_vote`, (content) => {
      console.log(`${sessionId}_vote ==>`, content)
      if (content) {
        setLastMessageToVote(content)
      }
    });
    return () => {
      socket?.off(`${sessionId}_vote`);
      setLastMessageToVote(null)
    };
  }, [sessionId, socket])
  function reset() {
    setMessages([]);
  }

  const chatContextValue: ChatContextData = {
    conversationInfo,
    messages,
    sendMessage,
    loading,
    failedMessage,
    reset,
    setLastMessageId,
    lastMessageToVote
  };

  return (
    <ChatSafeProvider value={chatContextValue}>
      {children}
    </ChatSafeProvider>
  );
};


// eslint-disable-next-line react-refresh/only-export-components
export { ChatProvider, useChat };
