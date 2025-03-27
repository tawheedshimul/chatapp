"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import { API_URL } from "../config"
import { Send, Menu } from "lucide-react"
import UserAvatar from "./UserAvatar"
import MessageBubble from "./MessageBubble"

const ChatWindow = ({ conversation, onMessageSent, onOpenSidebar }) => {
  const { currentUser } = useAuth()
  const { socket, isUserOnline } = useSocket()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messageContainerRef = useRef(null)

  useEffect(() => {
    if (!conversation) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const response = await fetch(`http://localhost:7000/api/messages/${conversation._id}`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (err) {
        console.error("Error fetching messages:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    setNewMessage("")
  }, [conversation])

  useEffect(() => {
    if (!socket || !conversation) return

    const handleNewMessage = (message) => {
      if (message.conversationId === conversation._id) {
        setMessages((prev) => [...prev, message])
        onMessageSent(conversation._id, message)
      }
    }

    const handleTyping = (data) => {
      if (data.conversationId === conversation._id && data.userId !== currentUser._id) {
        setTyping(true)
      }
    }

    const handleStopTyping = (data) => {
      if (data.conversationId === conversation._id && data.userId !== currentUser._id) {
        setTyping(false)
      }
    }

    socket.on("new_message", handleNewMessage)
    socket.on("typing", handleTyping)
    socket.on("stop_typing", handleStopTyping)

    return () => {
      socket.off("new_message", handleNewMessage)
      socket.off("typing", handleTyping)
      socket.off("stop_typing", handleStopTyping)
    }
  }, [socket, conversation, currentUser, onMessageSent])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typing])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || !conversation) return

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          conversationId: conversation._id,
          text: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage("")
      }
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)

    if (!socket || !conversation) return

    // Send typing indicator
    socket.emit("typing", {
      conversationId: conversation._id,
      userId: currentUser._id,
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId: conversation._id,
        userId: currentUser._id,
      })
    }, 2000)
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Select a conversation</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a conversation from the sidebar or start a new one to begin chatting
          </p>
          <button
            onClick={onOpenSidebar}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 md:hidden"
          >
            <Menu className="mr-2 h-4 w-4" />
            Open conversations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat header */}
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 flex items-center">
        <button
          onClick={onOpenSidebar}
          className="mr-3 md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-center">
          <div className="relative">
            <UserAvatar user={conversation.otherUser} />
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                isUserOnline(conversation.otherUser._id) ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            ></span>
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">{conversation.otherUser.username}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isUserOnline(conversation.otherUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messageContainerRef}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-3">
              <Send className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium mb-1">No messages yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.sender._id === currentUser._id}
              />
            ))}
            {typing && (
              <div className="flex items-start space-x-2 max-w-[70%]">
                <UserAvatar user={conversation.otherUser} size="small" />
                <div className="rounded-lg bg-gray-200 px-4 py-2 dark:bg-gray-700">
                  <div className="flex space-x-1">
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-500 dark:bg-gray-400"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-500 dark:bg-gray-400"
                      style={{ animationDelay: "200ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-500 dark:bg-gray-400"
                      style={{ animationDelay: "400ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow

